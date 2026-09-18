// The research feed for one instrument (R-11; requirements 38): its own news plus news reaching it
// through its group or industry, filings, corporate actions split into effective and announced,
// scheduled events ahead, and the restriction window that applies to it next.

import type { z } from 'zod';

import type { BlackoutWindow, InstrumentDto, NewsItemDto } from '../../schemas';
import type { InstrumentFeedDto, InstrumentNewsEntrySchema } from '../../schemas/instrument-feed';
import { InstrumentFeedSchema } from '../../schemas/instrument-feed';
import { generateCalendarEvents } from './calendarEvents';
import { getInstrumentById, getCanonicalInstruments } from './canonicalInstruments';
import { classificationForInstrument, peerSymbolsForSymbol } from './classification';
import { getCorporateActionsForInstrument } from './corporateActions';
import { structureForInstrument } from './corporateStructure';
import { ANNOUNCED_ACTION_SEEDS, FILING_SEEDS } from './instrumentFeedSeeds';
import type { MockGeneratorContext } from './mockContext';
import { generateNewsItems } from './newsEvents';
import { parseGenerated } from './validated';

const SOURCE = 'News providers, exchange filings and the corporate action register (mock)';
const DAY_MS = 86_400_000;

export interface RestrictionContext {
  // Employer rules are optional configuration (decision 43); off means no blackout applies.
  readonly policyEnabled: boolean;
  readonly blackouts: readonly BlackoutWindow[];
}

type NewsEntry = z.input<typeof InstrumentNewsEntrySchema>;

function newsFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  news: readonly NewsItemDto[],
): NewsEntry[] {
  const id = String(instrument.id);
  const structure = structureForInstrument(ctx, instrument);
  const classification = classificationForInstrument(ctx, instrument);
  const relatives = new Map<string, string>();
  for (const company of [
    ...(structure.parent === null ? [] : [structure.parent]),
    ...structure.related,
  ]) {
    if (company.instrumentId !== null) relatives.set(String(company.instrumentId), company.name);
  }
  const instruments = getCanonicalInstruments();
  const peers = new Map<string, string>();
  for (const symbol of peerSymbolsForSymbol(instrument.symbol)) {
    const peer = instruments.find((item) => item.symbol === symbol);
    if (peer !== undefined) peers.set(String(peer.id), symbol);
  }

  return news.flatMap((item): NewsEntry[] => {
    const named = item.relatedInstruments.map(String);
    if (named.includes(id)) return [{ item, reach: 'direct', via: null }];
    const relative = named.find((other) => relatives.has(other));
    if (relative !== undefined) {
      return [{ item, reach: 'group', via: relatives.get(relative) ?? null }];
    }
    if (structure.groupId !== null && (item.relatedGroupIds ?? []).includes(structure.groupId)) {
      return [{ item, reach: 'group', via: structure.groupName }];
    }
    const industryId = classification.industryId;
    if (industryId !== null && (item.relatedIndustryIds ?? []).includes(industryId)) {
      return [{ item, reach: 'peer', via: classification.industryName }];
    }
    const peer = named.find((other) => peers.has(other));
    if (peer !== undefined) return [{ item, reach: 'peer', via: peers.get(peer) ?? null }];
    return [];
  });
}

function restrictionFor(
  symbol: string,
  now: Date,
  restrictions: RestrictionContext,
): InstrumentFeedDto['nextRestrictionWindow'] | null {
  if (!restrictions.policyEnabled) return null;
  const nowIso = now.toISOString();
  const applicable = restrictions.blackouts
    .filter((window) => window.appliesToAll || window.symbols.includes(symbol))
    .filter((window) => window.endDate >= nowIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const window = applicable.find((item) => item.startDate <= nowIso) ?? applicable[0];
  if (window === undefined) return null;
  return {
    name: window.name,
    startDate: window.startDate,
    endDate: window.endDate,
    isActive: window.startDate <= nowIso,
  };
}

export function generateInstrumentFeed(
  ctx: MockGeneratorContext,
  instrumentId: string,
  now: Date,
  restrictions: RestrictionContext,
): InstrumentFeedDto | null {
  const instrument = getInstrumentById(instrumentId);
  if (instrument === undefined) return null;
  const today = String(ctx.referenceTime).slice(0, 10);
  const reference = Date.parse(`${today}T00:00:00Z`);

  const actions = getCorporateActionsForInstrument(instrumentId)
    .filter((action) => action.effectiveDate <= today)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  const filings = (FILING_SEEDS[instrument.symbol] ?? []).map((seed, index) => ({
    id: `${instrument.symbol}-filing-${String(index + 1)}`,
    filedAt: new Date(reference - seed.daysAgo * DAY_MS + 10 * 3_600_000).toISOString(),
    kind: seed.kind,
    title: seed.title,
    summary: seed.summary,
    filedWith: seed.filedWith,
  }));

  return parseGenerated(
    InstrumentFeedSchema,
    {
      instrumentId: String(instrument.id),
      news: newsFor(ctx, instrument, generateNewsItems(now)).sort((a, b) =>
        b.item.publishedAt.localeCompare(a.item.publishedAt),
      ),
      filings,
      effectiveActions: actions,
      announcedActions: (ANNOUNCED_ACTION_SEEDS[instrument.symbol] ?? []).filter(
        (seed) => seed.expectedEffectiveDate > today,
      ),
      upcomingEvents: generateCalendarEvents()
        .filter((event) => String(event.instrumentId) === instrumentId && event.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
      nextRestrictionWindow: restrictionFor(instrument.symbol, now, restrictions),
      asOf: today,
      source: SOURCE,
    },
    'instrument feed',
  );
}
