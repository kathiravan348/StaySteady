import { Button, NoResultsState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { JournalDto, JournalEntryKindDto } from '../../../data/schemas';
import styles from '../Journal.module.scss';
import type { JournalFilters } from '../model/journalFilters';
import {
  ALL,
  DEFAULT_JOURNAL_FILTERS,
  KINDS,
  KIND_LABELS,
  MANUAL,
  applyJournalFilters,
  isJournalFiltered,
  journalOptions,
} from '../model/journalFilters';
import { JournalEntryItem } from './JournalEntryItem';
import { PatternsPanel } from './PatternsPanel';

const OVERRIDE_OPTIONS: readonly { value: JournalFilters['override']; label: string }[] = [
  { value: 'all', label: 'With or without' },
  { value: 'yes', label: 'Overrides only' },
  { value: 'no', label: 'No override' },
];

export function JournalView({ journal }: { readonly journal: JournalDto }): ReactElement {
  const [filters, setFilters] = useState<JournalFilters>(DEFAULT_JOURNAL_FILTERS);
  const visible = applyJournalFilters(journal.entries, filters);
  const options = journalOptions(journal.entries);
  const known = journal.entries.filter((entry) => entry.outcome.verdict !== null);
  const withIt = known.filter((entry) => entry.outcome.verdict === 'with').length;

  return (
    <div className={styles.page}>
      <PatternsPanel patterns={journal.patterns} entries={journal.entries} />

      <p className={styles.note}>
        {known.length === 0
          ? 'No outcomes are known yet.'
          : `Of ${String(known.length)} decisions with a known outcome, ${String(withIt)} went the way you expected at the time. Outcomes are the price move over the 30 days after.`}
      </p>

      <div className={styles.filterBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Type</span>
          <select
            className={styles.input}
            value={filters.kind}
            onChange={(event) => {
              const kind: JournalEntryKindDto | undefined = KINDS.find(
                (item) => item === event.target.value,
              );
              setFilters({ ...filters, kind: kind ?? ALL });
            }}
          >
            <option value={ALL}>Any type</option>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Instrument</span>
          <select
            className={styles.input}
            value={filters.instrument}
            onChange={(event) => {
              setFilters({ ...filters, instrument: event.target.value });
            }}
          >
            <option value={ALL}>Any instrument</option>
            {options.instruments.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Strategy</span>
          <select
            className={styles.input}
            value={filters.strategy}
            onChange={(event) => {
              setFilters({ ...filters, strategy: event.target.value });
            }}
          >
            <option value={ALL}>Any</option>
            <option value={MANUAL}>No strategy (your own)</option>
            {options.strategies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Override</span>
          <select
            className={styles.input}
            value={filters.override}
            onChange={(event) => {
              const next = OVERRIDE_OPTIONS.find((item) => item.value === event.target.value);
              setFilters({ ...filters, override: next?.value ?? 'all' });
            }}
          >
            {OVERRIDE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.meta}>
          Showing {visible.length} of {journal.entries.length}, newest first
        </span>
      </div>

      {visible.length === 0 ? (
        <NoResultsState
          title="No decisions match these filters"
          description="Clear the filters to see the whole journal."
          action={
            isJournalFiltered(filters) ? (
              <Button
                variant="secondary"
                onPress={() => {
                  setFilters(DEFAULT_JOURNAL_FILTERS);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles.list} aria-label="Decisions">
          {visible.map((entry) => (
            <JournalEntryItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
