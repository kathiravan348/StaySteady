// Overview view model types (UI spec 7.1).

import type { DirectionDto, InstrumentDto, NewsItemDto } from '../../../data/schemas';
import type { Money } from '../../../shared/money';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';

export type BaseMoney = Money<BaseCurrencyCode>;

export interface HeadlineFigures {
  readonly totalValue: BaseMoney;
  readonly costBasis: BaseMoney;
  readonly unrealisedGain: BaseMoney;
  readonly unrealisedGainPercent: number;
  readonly todayChange: BaseMoney;
  readonly todayChangePercent: number;
  readonly cash: BaseMoney;
  readonly deployedPercent: number;
  readonly openPositions: number;
}

export interface ValuedPosition {
  readonly instrument: InstrumentDto;
  readonly lastPrice: Money;
  readonly changePercent: number;
  readonly direction: DirectionDto;
  readonly baseValue: BaseMoney;
  readonly quoteTimestamp: IsoUtcTimestamp | null;
}

export type AllocationDimension = 'country' | 'currency' | 'type';

export interface AllocationSlice {
  readonly label: string;
  readonly value: BaseMoney;
  readonly percent: number;
}

export type AllocationBreakdown = Readonly<Record<AllocationDimension, readonly AllocationSlice[]>>;

export type AttentionReason =
  | { readonly kind: 'unusual-move'; readonly changePercent: number }
  | { readonly kind: 'high-importance-news'; readonly count: number };

export interface AttentionItem {
  readonly instrument: InstrumentDto;
  readonly reasons: readonly AttentionReason[];
}

export interface HoldingsNewsItem {
  readonly item: NewsItemDto;
  // UI spec 7.6 — the same story from several outlets is shown once with its source count.
  readonly sourceCount: number;
}

export interface PortfolioOverview {
  readonly headline: HeadlineFigures;
  readonly positions: readonly ValuedPosition[];
  readonly allocation: AllocationBreakdown;
  readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
}
