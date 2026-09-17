import type { ReactElement } from 'react';

import type { OrderFilterOptions, OrderFilters } from '../model/orderFilters';
import { ALL, STATUS_LABELS } from '../model/orderFilters';
import styles from '../Orders.module.scss';

export interface OrderFilterBarProps {
  readonly filters: OrderFilters;
  readonly options: OrderFilterOptions;
  readonly shown: number;
  readonly total: number;
  readonly onChange: (filters: OrderFilters) => void;
}

// UI spec 7.13 — filter the history by broker, market, status, strategy and date.
export function OrderFilterBar({
  filters,
  options,
  shown,
  total,
  onChange,
}: OrderFilterBarProps): ReactElement {
  return (
    <div className={styles.filterBar}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Broker</span>
        <select
          className={styles.input}
          value={filters.broker}
          onChange={(event) => {
            onChange({ ...filters, broker: event.target.value });
          }}
        >
          <option value={ALL}>Any broker</option>
          {options.brokers.map((broker) => (
            <option key={broker.id} value={broker.id}>
              {broker.name}
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
        <span className={styles.fieldLabel}>Status</span>
        <select
          className={styles.input}
          value={filters.status}
          onChange={(event) => {
            const status = options.statuses.find((item) => item === event.target.value) ?? ALL;
            onChange({ ...filters, status });
          }}
        >
          <option value={ALL}>Any status</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
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
            onChange({ ...filters, strategy: event.target.value });
          }}
        >
          <option value={ALL}>Any origin</option>
          {options.strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.id}>
              {strategy.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>From</span>
        <input
          type="date"
          className={styles.input}
          value={filters.from}
          onChange={(event) => {
            onChange({ ...filters, from: event.target.value });
          }}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>To</span>
        <input
          type="date"
          className={styles.input}
          value={filters.to}
          onChange={(event) => {
            onChange({ ...filters, to: event.target.value });
          }}
        />
      </label>
      <span className={styles.meta}>
        Showing {shown} of {total}
      </span>
    </div>
  );
}
