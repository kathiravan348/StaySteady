// Allocation, movers, attention, news and events lists for the Overview (UI spec 7.1). Pure.

import { Decimal } from 'decimal.js';

import type { CalendarEventDto, MarketDto, NewsItemDto } from '../../../data/schemas';
import type { ClassificationLookup } from '../../../shared/classification/classificationIndex';
import { humanizeToken } from '../../../shared/format';
import { createMoney } from '../../../shared/money';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import type {
  AllocationBreakdown,
  AllocationDimension,
  AllocationSlice,
  AttentionItem,
  AttentionReason,
  HoldingsNewsItem,
  ValuedPosition,
} from './overviewTypes';

export const ALLOCATION_DIMENSIONS: readonly AllocationDimension[] = [
  'country',
  'currency',
  'type',
  'sector',
  'group',
];

const MOVER_COUNT = 3;
const LIST_LIMIT = 4;
// A daily move at or beyond this size is flagged for attention.
export const UNUSUAL_MOVE_PERCENT = 3;

const IMPORTANCE_RANK: Readonly<Record<NewsItemDto['importance'], number>> = {
  high: 0,
  medium: 1,
  low: 2,
};

export { humanizeToken };

function dimensionLabel(
  position: ValuedPosition,
  dimension: AllocationDimension,
  markets: readonly MarketDto[],
  classification: ClassificationLookup,
): string {
  switch (dimension) {
    case 'country':
      return (
        markets.find((market) => market.marketId === position.instrument.marketId)?.country ??
        position.instrument.marketId
      );
    case 'currency':
      return position.instrument.currency;
    case 'type':
      return humanizeToken(position.instrument.type);
    case 'sector':
      return classification.sectorLabel(String(position.instrument.id));
    case 'group':
      return classification.groupLabel(String(position.instrument.id));
  }
}

export interface AllocationRequest {
  readonly positions: readonly ValuedPosition[];
  readonly markets: readonly MarketDto[];
  readonly total: Decimal;
  readonly baseCurrency: BaseCurrencyCode;
  readonly classification: ClassificationLookup;
}

export function buildAllocation(request: AllocationRequest): AllocationBreakdown {
  const build = (dimension: AllocationDimension): readonly AllocationSlice[] => {
    const groups = new Map<string, Decimal>();
    for (const position of request.positions) {
      const label = dimensionLabel(position, dimension, request.markets, request.classification);
      groups.set(label, (groups.get(label) ?? new Decimal(0)).plus(position.baseValue.amount));
    }
    return [...groups.entries()]
      .map(([label, amount]) => ({
        label,
        value: createMoney(amount, request.baseCurrency),
        percent: request.total.isZero()
          ? 0
          : amount.dividedBy(request.total).times(100).toDecimalPlaces(1).toNumber(),
      }))
      .sort((a, b) => b.percent - a.percent);
  };
  return {
    country: build('country'),
    currency: build('currency'),
    type: build('type'),
    sector: build('sector'),
    group: build('group'),
  };
}

export interface Movers {
  readonly gainers: readonly ValuedPosition[];
  readonly losers: readonly ValuedPosition[];
}

export function selectMovers(positions: readonly ValuedPosition[]): Movers {
  const sorted = [...positions].sort((a, b) => b.changePercent - a.changePercent);
  return {
    gainers: sorted.filter((position) => position.changePercent > 0).slice(0, MOVER_COUNT),
    losers: sorted
      .filter((position) => position.changePercent < 0)
      .reverse()
      .slice(0, MOVER_COUNT),
  };
}

// Exit levels are not in the data yet, so attention covers unusual moves and flagged news only.
export function selectAttention(
  positions: readonly ValuedPosition[],
  news: readonly NewsItemDto[] | undefined,
): readonly AttentionItem[] {
  return positions.flatMap((position) => {
    const reasons: AttentionReason[] = [];
    if (Math.abs(position.changePercent) >= UNUSUAL_MOVE_PERCENT) {
      reasons.push({ kind: 'unusual-move', changePercent: position.changePercent });
    }
    const flagged = (news ?? []).filter(
      (item) =>
        item.importance === 'high' && item.relatedInstruments.includes(position.instrument.id),
    );
    // Count stories, not articles: one story republished by several outlets counts once.
    const storyCount = new Set(flagged.map((item) => item.duplicateGroupId ?? item.id)).size;
    if (storyCount > 0) {
      reasons.push({ kind: 'high-importance-news', count: storyCount });
    }
    return reasons.length > 0 ? [{ instrument: position.instrument, reasons }] : [];
  });
}

export function selectHoldingsNews(
  news: readonly NewsItemDto[],
  heldInstrumentIds: ReadonlySet<string>,
): readonly HoldingsNewsItem[] {
  const relevant = news.filter((item) =>
    item.relatedInstruments.some((id) => heldInstrumentIds.has(id)),
  );
  const groupSizes = new Map<string, number>();
  for (const item of relevant) {
    if (item.duplicateGroupId !== undefined) {
      groupSizes.set(item.duplicateGroupId, (groupSizes.get(item.duplicateGroupId) ?? 0) + 1);
    }
  }
  const seenGroups = new Set<string>();
  return [...relevant]
    .sort(
      (a, b) =>
        IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance] ||
        b.publishedAt.localeCompare(a.publishedAt),
    )
    .filter((item) => {
      if (item.duplicateGroupId === undefined) {
        return true;
      }
      const isFirst = !seenGroups.has(item.duplicateGroupId);
      seenGroups.add(item.duplicateGroupId);
      return isFirst;
    })
    .slice(0, LIST_LIMIT)
    .map((item) => ({
      item,
      sourceCount:
        item.duplicateGroupId === undefined ? 1 : (groupSizes.get(item.duplicateGroupId) ?? 1),
    }));
}

// Calendar events are keyed by market, so events for any market you hold are shown.
export function selectUpcomingEvents(
  events: readonly CalendarEventDto[],
  heldMarketIds: ReadonlySet<string>,
  today: string,
): readonly CalendarEventDto[] {
  return events
    .filter((event) => event.date >= today && heldMarketIds.has(event.marketId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, LIST_LIMIT);
}
