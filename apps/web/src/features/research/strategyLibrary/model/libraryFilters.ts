// Filtering the strategy library (UI spec 7.7): by stage, market, instrument type and performance.

import type { StrategyLibraryEntryDto, StrategyStageDto } from '../../../../data/schemas';

export const ALL = 'all';

// Performance is expressed against the strategy's own backtest, because an absolute return says
// nothing about whether the strategy is behaving as it was proven to.
export type PerformanceFilter = 'all' | 'ahead-of-backtest' | 'behind-backtest' | 'not-live';

export interface LibraryFilters {
  readonly stage: StrategyStageDto | typeof ALL;
  readonly market: string;
  readonly instrumentType: string;
  readonly performance: PerformanceFilter;
}

export const DEFAULT_FILTERS: LibraryFilters = {
  stage: ALL,
  market: ALL,
  instrumentType: ALL,
  performance: ALL,
};

export const STAGE_LABELS: Readonly<Record<StrategyStageDto, string>> = {
  draft: 'Draft',
  backtested: 'Backtested',
  observation: 'Observation',
  semi_automatic: 'Semi-automatic',
  fully_automatic: 'Fully automatic',
};

export const PERFORMANCE_LABELS: Readonly<Record<PerformanceFilter, string>> = {
  all: 'Any performance',
  'ahead-of-backtest': 'Ahead of backtest',
  'behind-backtest': 'Behind backtest',
  'not-live': 'Not live yet',
};

function matchesPerformance(entry: StrategyLibraryEntryDto, filter: PerformanceFilter): boolean {
  if (filter === ALL) return true;
  if (filter === 'not-live') return entry.live === null;
  if (entry.live === null || entry.divergence === null) return false;
  return filter === 'ahead-of-backtest'
    ? entry.divergence.deltaPercentagePoints >= 0
    : entry.divergence.deltaPercentagePoints < 0;
}

export function applyFilters(
  entries: readonly StrategyLibraryEntryDto[],
  filters: LibraryFilters,
): readonly StrategyLibraryEntryDto[] {
  return entries.filter(
    (entry) =>
      (filters.stage === ALL || entry.stage === filters.stage) &&
      (filters.market === ALL || entry.marketIds.includes(filters.market)) &&
      (filters.instrumentType === ALL || entry.instrumentTypes.includes(filters.instrumentType)) &&
      matchesPerformance(entry, filters.performance),
  );
}

export interface FilterOptions {
  readonly markets: readonly string[];
  readonly instrumentTypes: readonly string[];
  readonly stages: readonly StrategyStageDto[];
}

// Options come from the data, so a market with no strategies never appears as a dead choice.
export function filterOptions(entries: readonly StrategyLibraryEntryDto[]): FilterOptions {
  return {
    markets: [...new Set(entries.flatMap((entry) => [...entry.marketIds]))].sort(),
    instrumentTypes: [...new Set(entries.flatMap((entry) => [...entry.instrumentTypes]))].sort(),
    stages: [...new Set(entries.map((entry) => entry.stage))],
  };
}

export function isFiltered(filters: LibraryFilters): boolean {
  return (
    filters.stage !== ALL ||
    filters.market !== ALL ||
    filters.instrumentType !== ALL ||
    filters.performance !== ALL
  );
}
