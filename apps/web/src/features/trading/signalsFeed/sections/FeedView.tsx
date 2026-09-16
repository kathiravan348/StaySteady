import { Badge, Button, NoResultsState, cx } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto } from '../../../../data/api';
import type { SignalFeedEntryDto, SignalOutcomeDto } from '../../../../data/schemas';
import { formatMoney, formatRelativeTime } from '../../../../shared/format';
import type { FeedFilters } from '../model/feedFilters';
import {
  ALL,
  DEFAULT_FEED_FILTERS,
  OUTCOME_LABELS,
  applyFeedFilters,
  feedCounts,
  feedOptions,
  isFeedFiltered,
} from '../model/feedFilters';
import styles from '../SignalsFeed.module.scss';

export interface FeedViewProps {
  readonly entries: readonly SignalFeedEntryDto[];
}

const OUTCOME_VARIANT: Readonly<Record<SignalOutcomeDto, BadgeVariant>> = {
  open: 'info',
  awaiting_approval: 'warning',
  executed: 'positive',
  blocked: 'critical',
  rejected: 'negative',
  expired: 'neutral',
};

function SignalRow({ entry }: { readonly entry: SignalFeedEntryDto }): ReactElement {
  const isBlocked = entry.outcome === 'blocked';
  return (
    <li className={cx(styles.row, isBlocked ? styles.rowBlocked : undefined)}>
      <div className={styles.headline}>
        <span className={styles.symbol}>{entry.instrumentSymbol}</span>
        <span className={cx(styles.side, entry.direction === 'buy' ? styles.buy : styles.sell)}>
          {entry.direction}
        </span>
        <span className={styles.meta}>
          {String(entry.targetQuantity)} units
          {entry.targetPrice !== null && ` at ${formatMoney(moneyFromDto(entry.targetPrice))}`}
        </span>
        {entry.isSimulated && <Badge variant="neutral">Simulated</Badge>}
      </div>

      <div className={styles.side2}>
        <Badge variant={OUTCOME_VARIANT[entry.outcome]}>{OUTCOME_LABELS[entry.outcome]}</Badge>
        <span className={styles.meta}>{formatRelativeTime(entry.generatedAt)}</span>
      </div>

      <p className={styles.rationale}>
        {entry.rationale}
        <span className={styles.meta}>
          {' '}
          · {entry.strategyName} · {entry.instrumentName} · {entry.marketId} ·{' '}
          {Math.round(entry.confidence * 100)}% confidence
        </span>
      </p>

      {entry.blockedBy !== null && (
        <p className={styles.blockedNote}>
          <strong>{entry.blockedBy.limitName}:</strong> {entry.blockedBy.detail}
        </p>
      )}
    </li>
  );
}

// UI spec 7.12 — every signal generated, including the ones the safety layer stopped.
export function FeedView({ entries }: FeedViewProps): ReactElement {
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FEED_FILTERS);
  const visible = applyFeedFilters(entries, filters);
  const options = feedOptions(entries);
  const counts = feedCounts(entries);

  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Signals</span>
          <span className={styles.summaryValue}>{counts.total}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Awaiting your approval</span>
          <span className={styles.summaryValue}>{counts.awaiting}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Blocked by a limit</span>
          <span className={styles.summaryValue}>{counts.blocked}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Simulated</span>
          <span className={styles.summaryValue}>{counts.simulated}</span>
        </span>
      </div>

      <div className={styles.filterBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Outcome</span>
          <select
            className={styles.input}
            value={filters.outcome}
            onChange={(event) => {
              setFilters({ ...filters, outcome: event.target.value as FeedFilters['outcome'] });
            }}
          >
            <option value={ALL}>Any outcome</option>
            {options.outcomes.map((outcome) => (
              <option key={outcome} value={outcome}>
                {OUTCOME_LABELS[outcome]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Strategy</span>
          <select
            className={styles.input}
            value={filters.strategyId}
            onChange={(event) => {
              setFilters({ ...filters, strategyId: event.target.value });
            }}
          >
            <option value={ALL}>Any strategy</option>
            {options.strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Direction</span>
          <select
            className={styles.input}
            value={filters.direction}
            onChange={(event) => {
              setFilters({ ...filters, direction: event.target.value as FeedFilters['direction'] });
            }}
          >
            <option value="all">Any direction</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Execution</span>
          <select
            className={styles.input}
            value={filters.execution}
            onChange={(event) => {
              setFilters({ ...filters, execution: event.target.value as FeedFilters['execution'] });
            }}
          >
            <option value="all">Real and simulated</option>
            <option value="real">Real only</option>
            <option value="simulated">Simulated only</option>
          </select>
        </label>

        <span className={styles.meta}>
          Showing {visible.length} of {entries.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <NoResultsState
          title="No signals match these filters"
          description="Clear the filters to see the whole feed."
          action={
            isFeedFiltered(filters) ? (
              <Button
                variant="secondary"
                onPress={() => {
                  setFilters(DEFAULT_FEED_FILTERS);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles.feedList}>
          {visible.map((entry) => (
            <SignalRow key={entry.signalId} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
