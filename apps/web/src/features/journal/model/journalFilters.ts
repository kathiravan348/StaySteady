// Filtering the decision journal (UI spec 19.1): by type, instrument, strategy and whether an override
// was involved.

import type { JournalEntryDto, JournalEntryKindDto } from '../../../data/schemas';

export const ALL = 'all';
export const MANUAL = 'manual';

export interface JournalFilters {
  readonly kind: JournalEntryKindDto | typeof ALL;
  readonly instrument: string;
  // A strategy name, MANUAL for entries no strategy raised, or ALL.
  readonly strategy: string;
  readonly override: 'all' | 'yes' | 'no';
}

export const DEFAULT_JOURNAL_FILTERS: JournalFilters = {
  kind: ALL,
  instrument: ALL,
  strategy: ALL,
  override: 'all',
};

export const KIND_LABELS: Readonly<Record<JournalEntryKindDto, string>> = {
  manual_trade: 'Manual trade',
  limit_override: 'Limit override',
  approval_decision: 'Approval decision',
};

export const KINDS: readonly JournalEntryKindDto[] = [
  'manual_trade',
  'limit_override',
  'approval_decision',
];

export function applyJournalFilters(
  entries: readonly JournalEntryDto[],
  filters: JournalFilters,
): readonly JournalEntryDto[] {
  return entries.filter(
    (entry) =>
      (filters.kind === ALL || entry.kind === filters.kind) &&
      (filters.instrument === ALL || entry.symbol === filters.instrument) &&
      (filters.strategy === ALL ||
        (filters.strategy === MANUAL
          ? entry.strategyName === null
          : entry.strategyName === filters.strategy)) &&
      (filters.override === 'all' || entry.override === (filters.override === 'yes')),
  );
}

export function journalOptions(entries: readonly JournalEntryDto[]): {
  instruments: readonly string[];
  strategies: readonly string[];
} {
  const unique = (values: readonly (string | null)[]): string[] =>
    [...new Set(values.filter((value): value is string => value !== null))].sort();
  return {
    instruments: unique(entries.map((entry) => entry.symbol)),
    strategies: unique(entries.map((entry) => entry.strategyName)),
  };
}

export const isJournalFiltered = (filters: JournalFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(DEFAULT_JOURNAL_FILTERS);
