import type { ReactElement } from 'react';

import { humanizeToken } from '../../../../shared/format';
import type { FilterOptions, LibraryFilters, PerformanceFilter } from '../model/libraryFilters';
import { ALL, PERFORMANCE_LABELS, STAGE_LABELS } from '../model/libraryFilters';
import styles from '../StrategyLibrary.module.scss';

export interface LibraryFilterBarProps {
  readonly filters: LibraryFilters;
  readonly options: FilterOptions;
  readonly shown: number;
  readonly total: number;
  readonly onChange: (filters: LibraryFilters) => void;
}

// UI spec 7.7 — filters by stage, market, instrument type and performance.
export function LibraryFilterBar({
  filters,
  options,
  shown,
  total,
  onChange,
}: LibraryFilterBarProps): ReactElement {
  return (
    <div className={styles.filterBar}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Stage</span>
        <select
          className={styles.input}
          value={filters.stage}
          onChange={(event) => {
            onChange({ ...filters, stage: event.target.value as LibraryFilters['stage'] });
          }}
        >
          <option value={ALL}>Any stage</option>
          {options.stages.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Market</span>
        <select
          className={styles.input}
          value={filters.market}
          onChange={(event) => {
            onChange({ ...filters, market: event.target.value });
          }}
        >
          <option value={ALL}>Any market</option>
          {options.markets.map((market) => (
            <option key={market} value={market}>
              {market}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Instrument type</span>
        <select
          className={styles.input}
          value={filters.instrumentType}
          onChange={(event) => {
            onChange({ ...filters, instrumentType: event.target.value });
          }}
        >
          <option value={ALL}>Any type</option>
          {options.instrumentTypes.map((type) => (
            <option key={type} value={type}>
              {humanizeToken(type)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Performance</span>
        <select
          className={styles.input}
          value={filters.performance}
          onChange={(event) => {
            onChange({ ...filters, performance: event.target.value as PerformanceFilter });
          }}
        >
          {Object.entries(PERFORMANCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <span className={styles.meta}>
        Showing {shown} of {total}
      </span>
    </div>
  );
}
