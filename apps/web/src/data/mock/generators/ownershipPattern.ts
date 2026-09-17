// Ownership pattern over the last eight reported quarters (R-01; requirements 36). A promoter or
// founder block is reported in some markets and not others, and a promoter's pledged shares are a
// warning rather than a statistic, so the trend is held, not just the latest figure.

import type { InstrumentDto } from '../../schemas';
import type {
  InstrumentOwnershipDto,
  InstrumentOwnershipResponseDto,
} from '../../schemas/classification';
import {
  InstrumentOwnershipResponseSchema,
  InstrumentOwnershipSchema,
} from '../../schemas/classification';
import { getInstrumentById } from './canonicalInstruments';
import { INDUSTRY_BY_SYMBOL } from './classificationAssignments';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

const QUARTERS = 8;
const SOURCE = 'Quarterly shareholding disclosures (mock)';

interface OwnershipProfile {
  // Null where the market does not report a promoter or founder block at all.
  readonly promoter: number | null;
  readonly foreign: number;
  readonly domestic: number;
  // Pledge at the oldest quarter and at the latest, interpolated between the two.
  readonly pledgeFrom?: number;
  readonly pledgeTo?: number;
}

const PROFILES: Readonly<Record<string, OwnershipProfile>> = {
  RELIANCE: { promoter: 50.3, foreign: 22.1, domestic: 17.3, pledgeFrom: 0, pledgeTo: 0 },
  // The rising pledge the mock data needs (UI spec 20.4): 2.1% to 9.4% over two years.
  TATAMOTORS: { promoter: 42.6, foreign: 18.4, domestic: 24.0, pledgeFrom: 2.1, pledgeTo: 9.4 },
  TCS: { promoter: 71.8, foreign: 12.5, domestic: 10.5, pledgeFrom: 0, pledgeTo: 0 },
  INFY: { promoter: 14.6, foreign: 33.0, domestic: 38.0, pledgeFrom: 0, pledgeTo: 0 },
  // Nil promoter holding after the merger: reported as zero, which is not the same as not reported.
  HDFCBANK: { promoter: 0, foreign: 47.2, domestic: 34.1, pledgeFrom: 0, pledgeTo: 0 },
  SWIGGY: { promoter: 0, foreign: 25.4, domestic: 30.2, pledgeFrom: 0, pledgeTo: 0 },
  AAPL: { promoter: null, foreign: 13.4, domestic: 48.6 },
  MSFT: { promoter: null, foreign: 14.1, domestic: 56.2 },
  NVDA: { promoter: null, foreign: 12.8, domestic: 53.4 },
  GOOGL: { promoter: null, foreign: 11.9, domestic: 49.7 },
  TSLA: { promoter: null, foreign: 9.6, domestic: 35.1 },
  'BRK.B': { promoter: null, foreign: 6.2, domestic: 54.8 },
  JNJ: { promoter: null, foreign: 12.4, domestic: 55.1 },
  JPM: { promoter: null, foreign: 13.7, domestic: 56.9 },
  V: { promoter: null, foreign: 14.9, domestic: 58.2 },
  AZN: { promoter: null, foreign: 41.3, domestic: 26.4 },
  '7203': { promoter: null, foreign: 23.6, domestic: 42.1 },
  D05: { promoter: null, foreign: 18.2, domestic: 44.7 },
};

// Calendar quarter ends, oldest first, so a trend reads left to right.
function quarterEnds(reference: string): string[] {
  const date = new Date(`${reference.slice(0, 10)}T00:00:00Z`);
  const lastQuarter = Math.floor(date.getUTCMonth() / 3) - 1;
  const ends: string[] = [];
  for (let index = QUARTERS - 1; index >= 0; index -= 1) {
    const quarter = lastQuarter - index;
    const year = date.getUTCFullYear() + Math.floor(quarter / 4);
    const month = (((quarter % 4) + 4) % 4) * 3 + 3;
    const end = new Date(Date.UTC(year, month, 0));
    ends.push(end.toISOString().slice(0, 10));
  }
  return ends;
}

const round = (value: number): number => Number(value.toFixed(2));

export function ownershipForInstrument(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): InstrumentOwnershipDto | null {
  const profile = PROFILES[instrument.symbol];
  if (profile === undefined) return null;

  const stream = ctx.random.fork(`ownership:${instrument.id}`);
  const ends = quarterEnds(String(ctx.referenceTime));
  const points = ends.map((periodEnd, index) => {
    const progress = index / (QUARTERS - 1);
    // Institutions drift quarter to quarter; the promoter block stays put unless it is diluted.
    const foreign = round(profile.foreign + stream.float(-0.8, 0.8));
    const domestic = round(profile.domestic + stream.float(-0.8, 0.8));
    const promoter = profile.promoter;
    const publicPercent = round(100 - (promoter ?? 0) - foreign - domestic);
    const pledge =
      profile.pledgeFrom === undefined || profile.pledgeTo === undefined
        ? null
        : round(profile.pledgeFrom + (profile.pledgeTo - profile.pledgeFrom) * progress);
    return {
      periodEnd,
      promoterPercent: promoter,
      foreignInstitutionalPercent: foreign,
      domesticInstitutionalPercent: domestic,
      publicPercent,
      promoterPledgePercent: pledge,
    };
  });

  const reportsPromoter = profile.promoter !== null;
  const latestPledge = points[points.length - 1]?.promoterPledgePercent ?? null;
  const firstPledge = points[0]?.promoterPledgePercent ?? null;
  const pledgeRising = latestPledge !== null && firstPledge !== null && latestPledge > firstPledge;
  const note = reportsPromoter
    ? pledgeRising
      ? `Promoter holding ${String(profile.promoter)}% with ${String(latestPledge)}% of it pledged, up from ${String(firstPledge)}% eight quarters ago.`
      : `Promoter holding ${String(profile.promoter)}% with no shares pledged.`
    : 'This market does not report a promoter or founder block; institutional and public holdings only.';

  return parseGenerated(
    InstrumentOwnershipSchema,
    {
      instrumentId: String(instrument.id),
      points,
      reportsPromoterHolding: reportsPromoter,
      asOf: ends[ends.length - 1] ?? String(ctx.referenceTime).slice(0, 10),
      source: SOURCE,
      note,
    },
    'instrument ownership',
  );
}

// Null means the instrument itself is unknown (a 404). A known instrument with no shareholders
// answers with the reason, because that is a fact about it rather than a failed request.
export function generateInstrumentOwnership(
  ctx: MockGeneratorContext,
  instrumentId: string,
): InstrumentOwnershipResponseDto | null {
  const instrument = getInstrumentById(instrumentId);
  if (instrument === undefined) return null;
  const ownership = ownershipForInstrument(ctx, instrument);
  const unavailableReason =
    ownership !== null
      ? null
      : INDUSTRY_BY_SYMBOL[instrument.symbol] === undefined
        ? 'No company sits behind this instrument, so it has no shareholding pattern.'
        : 'No shareholding disclosure has been collected for this company yet.';
  return parseGenerated(
    InstrumentOwnershipResponseSchema,
    { instrumentId: String(instrument.id), ownership, unavailableReason },
    'instrument ownership response',
  );
}
