// Filtering the signals feed (UI spec 7.12).

import type { SignalFeedEntryDto, SignalOutcomeDto } from '../../../../data/schemas';

export const ALL = 'all';

export interface FeedFilters {
  readonly outcome: SignalOutcomeDto | typeof ALL;
  readonly strategyId: string;
  readonly direction: 'all' | 'buy' | 'sell' | 'hold';
  // Simulated actions never reach a broker, so being able to see only the real ones matters.
  readonly execution: 'all' | 'real' | 'simulated';
}

export const DEFAULT_FEED_FILTERS: FeedFilters = {
  outcome: ALL,
  strategyId: ALL,
  direction: 'all',
  execution: 'all',
};

export const OUTCOME_LABELS: Readonly<Record<SignalOutcomeDto, string>> = {
  open: 'Open',
  awaiting_approval: 'Awaiting approval',
  executed: 'Executed',
  blocked: 'Blocked by a limit',
  rejected: 'Rejected',
  expired: 'Expired',
};

export function applyFeedFilters(
  entries: readonly SignalFeedEntryDto[],
  filters: FeedFilters,
): readonly SignalFeedEntryDto[] {
  return entries.filter(
    (entry) =>
      (filters.outcome === ALL || entry.outcome === filters.outcome) &&
      (filters.strategyId === ALL || String(entry.strategyId) === filters.strategyId) &&
      (filters.direction === 'all' || entry.direction === filters.direction) &&
      (filters.execution === 'all' ||
        (filters.execution === 'simulated' ? entry.isSimulated : !entry.isSimulated)),
  );
}

export interface FeedOptions {
  readonly outcomes: readonly SignalOutcomeDto[];
  readonly strategies: readonly { readonly id: string; readonly name: string }[];
}

// Options come from the data, so no filter offers a choice that would show nothing.
export function feedOptions(entries: readonly SignalFeedEntryDto[]): FeedOptions {
  const strategies = new Map<string, string>();
  entries.forEach((entry) => {
    strategies.set(String(entry.strategyId), entry.strategyName);
  });
  return {
    outcomes: [...new Set(entries.map((entry) => entry.outcome))],
    strategies: [...strategies].map(([id, name]) => ({ id, name })),
  };
}

export function isFeedFiltered(filters: FeedFilters): boolean {
  return (
    filters.outcome !== ALL ||
    filters.strategyId !== ALL ||
    filters.direction !== 'all' ||
    filters.execution !== 'all'
  );
}

export interface FeedCounts {
  readonly total: number;
  readonly blocked: number;
  readonly awaiting: number;
  readonly simulated: number;
}

export function feedCounts(entries: readonly SignalFeedEntryDto[]): FeedCounts {
  return {
    total: entries.length,
    blocked: entries.filter((entry) => entry.outcome === 'blocked').length,
    awaiting: entries.filter((entry) => entry.outcome === 'awaiting_approval').length,
    simulated: entries.filter((entry) => entry.isSimulated).length,
  };
}
