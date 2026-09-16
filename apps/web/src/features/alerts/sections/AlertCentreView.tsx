import { Button, NoResultsState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  AlertCategoryDto,
  AlertGroupDto,
  MarketDto,
  SeverityDto,
} from '../../../data/schemas';
import { AlertCategorySchema, SeveritySchema } from '../../../data/schemas';
import { ROUTES } from '../../../routes/routes';
import type { AlertFilters } from '../model/alertFilters';
import {
  ALL,
  CATEGORY_LABELS,
  DEFAULT_ALERT_FILTERS,
  NO_MARKET,
  SEVERITY,
  applyAlertFilters,
} from '../model/alertFilters';
import styles from '../Alerts.module.scss';
import { AlertItem } from './AlertItem';

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly { value: T; label: string }[];
  readonly onChange: (value: T) => void;
}): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={styles.input}
        value={value}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next !== undefined) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// UI spec 7.19 — every alert newest first, repeats grouped, filters, and the counts that matter first.
export function AlertCentreView({
  alerts,
  markets,
}: {
  readonly alerts: readonly AlertGroupDto[];
  readonly markets: readonly MarketDto[];
}): ReactElement {
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_ALERT_FILTERS);
  const visible = applyAlertFilters(alerts, filters);
  const marketName = (id: string | null): string | null =>
    id === null ? null : (markets.find((market) => String(market.marketId) === id)?.name ?? id);
  const open = alerts.filter((alert) => alert.state === 'open');
  const escalated = alerts.filter((alert) => alert.escalation?.hasEscalated === true);
  const marketIds = [...new Set(alerts.map((alert) => alert.marketId ?? NO_MARKET))];

  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.fieldLabel}>Open critical</span>
          <span className={styles.statValue}>
            {open.filter((alert) => alert.severity === 'critical').length}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.fieldLabel}>Unacknowledged</span>
          <span className={styles.statValue}>{open.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.fieldLabel}>Escalated</span>
          <span className={styles.statValue}>{escalated.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.fieldLabel}>Resolved</span>
          <span className={styles.statValue}>
            {alerts.filter((alert) => alert.state === 'resolved').length}
          </span>
        </div>
      </div>

      <div className={styles.filters} role="search" aria-label="Filter alerts">
        <Select<SeverityDto | typeof ALL>
          label="Severity"
          value={filters.severity}
          options={[
            { value: ALL, label: 'Any severity' },
            ...SeveritySchema.options.map((value) => ({ value, label: SEVERITY[value].label })),
          ]}
          onChange={(severity) => {
            setFilters({ ...filters, severity });
          }}
        />
        <Select<AlertCategoryDto | typeof ALL>
          label="Category"
          value={filters.category}
          options={[
            { value: ALL, label: 'Any category' },
            ...AlertCategorySchema.options.map((value) => ({
              value,
              label: CATEGORY_LABELS[value],
            })),
          ]}
          onChange={(category) => {
            setFilters({ ...filters, category });
          }}
        />
        <Select
          label="Market"
          value={filters.market}
          options={[
            { value: ALL, label: 'All markets' },
            ...marketIds.map((id) => ({
              value: id,
              label: id === NO_MARKET ? 'Not market-specific' : (marketName(id) ?? id),
            })),
          ]}
          onChange={(market) => {
            setFilters({ ...filters, market });
          }}
        />
        <Select<AlertFilters['state']>
          label="State"
          value={filters.state}
          options={[
            { value: 'active', label: 'Not resolved' },
            { value: 'open', label: 'Open' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'resolved', label: 'Resolved' },
            { value: ALL, label: 'All' },
          ]}
          onChange={(state) => {
            setFilters({ ...filters, state });
          }}
        />
        <Button
          variant="secondary"
          onPress={() => {
            setFilters(DEFAULT_ALERT_FILTERS);
          }}
        >
          Reset filters
        </Button>
      </div>

      <p className={styles.meta}>
        {visible.length} of {alerts.length} alerts, newest first. Who is told, and when alerts
        escalate, is set in <Link to={ROUTES.SETTINGS_ALERTS}>alert rules</Link>.
      </p>

      {visible.length === 0 ? (
        <NoResultsState
          title="No alerts match these filters"
          description="Widen the filters to see more."
          onClearFilters={() => {
            setFilters({ ...DEFAULT_ALERT_FILTERS, state: ALL });
          }}
        />
      ) : (
        <ul className={styles.list} aria-label="Alerts">
          {visible.map((alert) => (
            <AlertItem key={alert.id} alert={alert} marketName={marketName(alert.marketId)} />
          ))}
        </ul>
      )}
    </div>
  );
}
