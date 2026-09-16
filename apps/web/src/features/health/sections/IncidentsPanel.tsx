import { Badge, DataTable, ErrorState, LoadingState, NoResultsState } from '@staysteady/ui';
import type { ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { useComponentHealth, useIncidents } from '../../../data/api';
import type { IncidentDto, SeverityDto } from '../../../data/schemas';
import { formatDateTime, pluralize } from '../../../shared/format';
import type { IncidentFilters } from '../model/healthModel';
import {
  EMPTY_INCIDENT_FILTERS,
  filterIncidents,
  formatDuration,
  SEVERITY_META,
} from '../model/healthModel';
import styles from '../Health.module.scss';
import { useNow } from '../useNow';

const SEVERITIES: readonly SeverityDto[] = ['critical', 'high', 'medium', 'low'];
const getRowId = (incident: IncidentDto): string => incident.id;

function IncidentDetails({ incident }: { readonly incident: IncidentDto }): ReactElement {
  return (
    <div className={styles.details}>
      <div className={styles.stack}>
        <strong>Automatic actions taken</strong>
        {incident.automaticActions.length === 0 ? (
          <span className={styles.meta}>None</span>
        ) : (
          <ul className={styles.bullets}>
            {incident.automaticActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.stack}>
        <strong>Resolution</strong>
        <span>{incident.resolution ?? 'Not resolved yet'}</span>
      </div>
    </div>
  );
}

// UI spec 7.15 — every failure with start, duration, severity, components, actions and resolution.
export function IncidentsPanel(): ReactElement {
  const incidents = useIncidents();
  const components = useComponentHealth();
  const now = useNow(15_000);
  const [filters, setFilters] = useState<IncidentFilters>(EMPTY_INCIDENT_FILTERS);
  const names = useMemo(
    () => new Map((components.data ?? []).map((component) => [component.id, component.name])),
    [components.data],
  );
  const componentIds = useMemo(
    () =>
      [
        ...new Set((incidents.data ?? []).flatMap((incident) => incident.affectedComponents)),
      ].sort(),
    [incidents.data],
  );
  const rows = useMemo(
    () => filterIncidents(incidents.data ?? [], filters, names),
    [incidents.data, filters, names],
  );
  const update = (change: Partial<IncidentFilters>): void => {
    setFilters((current) => ({ ...current, ...change }));
  };

  const columns = useMemo<ColumnDef<IncidentDto, unknown>[]>(
    () => [
      {
        id: 'severity',
        header: 'Severity',
        accessorFn: (incident) => SEVERITIES.indexOf(incident.severity),
        cell: ({ row }) => (
          <Badge variant={SEVERITY_META[row.original.severity].variant}>
            {SEVERITY_META[row.original.severity].label}
          </Badge>
        ),
      },
      {
        id: 'title',
        header: 'Incident',
        accessorFn: (incident) => incident.title,
        cell: ({ row }) => (
          <span className={styles.stack}>
            <span>{row.original.title}</span>
            <span className={styles.meta}>
              {row.original.affectedComponents.map((id) => names.get(id) ?? id).join(', ')}
            </span>
          </span>
        ),
      },
      {
        id: 'startedAt',
        header: 'Started',
        accessorFn: (incident) => incident.startedAt,
        cell: ({ row }) => formatDateTime(row.original.startedAt, { includeSeconds: false }),
      },
      {
        id: 'duration',
        header: 'Duration',
        accessorFn: (incident) =>
          Date.parse(incident.resolvedAt ?? new Date(now).toISOString()) -
          Date.parse(incident.startedAt),
        meta: { align: 'end', label: 'Duration' },
        cell: ({ row }) =>
          formatDuration(
            Date.parse(row.original.resolvedAt ?? new Date(now).toISOString()) -
              Date.parse(row.original.startedAt),
          ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (incident) => (incident.resolvedAt === undefined ? 0 : 1),
        cell: ({ row }) =>
          row.original.resolvedAt === undefined ? (
            <Badge variant="critical">
              <span aria-hidden="true">●</span> Ongoing
            </Badge>
          ) : (
            <Badge variant="neutral">
              <span aria-hidden="true">✓</span> Resolved
            </Badge>
          ),
      },
    ],
    [names, now],
  );

  if (incidents.data === undefined) {
    return incidents.isError ? (
      <ErrorState
        title="Incident history unavailable"
        message={incidents.error.message}
        onRetry={() => {
          void incidents.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={6} />
    );
  }

  const ongoing = incidents.data.filter((incident) => incident.resolvedAt === undefined).length;
  return (
    <div className={styles.section}>
      <p className={styles.meta} role="status">
        {pluralize(incidents.data.length, 'incident')} recorded ·{' '}
        {ongoing === 0 ? 'none ongoing' : `${ongoing} ongoing`}
      </p>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Search incidents</span>
          <input
            type="search"
            className={styles.input}
            value={filters.search}
            placeholder="Title, component, action or resolution"
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Severity</span>
          <select
            className={styles.input}
            value={filters.severity}
            onChange={(event) => {
              const severity = SEVERITIES.find((option) => option === event.target.value);
              update({ severity: severity ?? 'all' });
            }}
          >
            <option value="all">All severities</option>
            {SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {SEVERITY_META[severity].label}
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
              const value = event.target.value;
              update({ status: value === 'ongoing' || value === 'resolved' ? value : 'all' });
            }}
          >
            <option value="all">Ongoing and resolved</option>
            <option value="ongoing">Ongoing</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Component</span>
          <select
            className={styles.input}
            value={filters.component}
            onChange={(event) => update({ component: event.target.value })}
          >
            <option value="all">All components</option>
            {componentIds.map((id) => (
              <option key={id} value={id}>
                {names.get(id) ?? id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={getRowId}
        ariaLabel="Incident history"
        enablePagination={false}
        renderRowDetails={(incident) => <IncidentDetails incident={incident} />}
        emptyState={
          <NoResultsState
            title="No incidents match"
            description="Change the search or filters to see more incidents."
            clearLabel="Clear filters"
            onClearFilters={() => setFilters(EMPTY_INCIDENT_FILTERS)}
          />
        }
      />
    </div>
  );
}
