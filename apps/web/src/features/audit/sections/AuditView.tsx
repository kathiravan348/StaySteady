import { Badge, Button, DataTable, NoResultsState } from '@staysteady/ui';
import type { BadgeVariant, ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type { AuditCategoryDto, AuditEntryDto, AuditTriggerDto } from '../../../data/schemas';
import { AuditCategorySchema, AuditTriggerSchema } from '../../../data/schemas';
import { formatDateTime } from '../../../shared/format';
import type { AuditFilters } from '../model/auditFilters';
import {
  ALL,
  CATEGORY_LABELS,
  DEFAULT_AUDIT_FILTERS,
  TRIGGER_LABELS,
  applyAuditFilters,
} from '../model/auditFilters';
import styles from '../Audit.module.scss';
import { DecisionChain } from './DecisionChain';

const CATEGORY_VARIANT: Readonly<Record<AuditCategoryDto, BadgeVariant>> = {
  configuration: 'neutral',
  approval: 'info',
  order: 'info',
  signal: 'neutral',
  risk_limit: 'warning',
  emergency: 'critical',
  strategy_stage: 'positive',
  strategy_definition: 'neutral',
};

function Changes({
  entry,
  onTrace,
}: {
  readonly entry: AuditEntryDto;
  readonly onTrace: (entry: AuditEntryDto) => void;
}): ReactElement {
  return (
    <div className={styles.stack}>
      {entry.reason !== null && <p className={styles.note}>{entry.reason}</p>}
      {entry.changes.length === 0 ? (
        <p className={styles.meta}>No field-level change: this entry records an event.</p>
      ) : (
        <table className={styles.changes}>
          <thead>
            <tr>
              <th scope="col">What changed</th>
              <th scope="col">Before</th>
              <th scope="col">After</th>
            </tr>
          </thead>
          <tbody>
            {entry.changes.map((change) => (
              <tr key={change.field}>
                <th scope="row">{change.field}</th>
                <td className={styles.before}>{change.before ?? '—'}</td>
                <td className={styles.after}>{change.after ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {entry.orderId !== null && (
        <span>
          <Button
            variant="secondary"
            onPress={() => {
              onTrace(entry);
            }}
          >
            Trace the decision chain
          </Button>
        </span>
      )}
    </div>
  );
}

// UI spec 7.20 — the complete record, filterable and searchable, with before and after for every
// change and the decision chain for anything that belongs to an order.
export function AuditView({
  entries,
}: {
  readonly entries: readonly AuditEntryDto[];
}): ReactElement {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_AUDIT_FILTERS);
  const [traced, setTraced] = useState<AuditEntryDto | null>(null);
  const visible = applyAuditFilters(entries, filters);
  const set = <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]): void => {
    setFilters({ ...filters, [key]: value });
  };

  const columns = useMemo<ColumnDef<AuditEntryDto, unknown>[]>(
    () => [
      {
        id: 'at',
        header: 'When',
        accessorFn: (entry) => entry.at,
        cell: ({ row }) => formatDateTime(row.original.at),
      },
      {
        id: 'category',
        header: 'Type',
        accessorFn: (entry) => entry.category,
        cell: ({ row }) => (
          <Badge variant={CATEGORY_VARIANT[row.original.category]}>
            {CATEGORY_LABELS[row.original.category]}
          </Badge>
        ),
      },
      { id: 'title', header: 'What happened', accessorFn: (entry) => entry.title },
      { id: 'subject', header: 'About', accessorFn: (entry) => entry.subject },
      {
        id: 'trigger',
        header: 'Triggered by',
        accessorFn: (entry) => TRIGGER_LABELS[entry.trigger],
      },
      {
        id: 'changes',
        header: 'Changes',
        accessorFn: (entry) => entry.changes.length,
        meta: { align: 'end', label: 'Changes' },
      },
    ],
    [],
  );

  return (
    <div className={styles.page}>
      <div className={styles.filters} role="search" aria-label="Filter the audit log">
        <label className={`${styles.field} ${styles.search}`}>
          <span className={styles.fieldLabel}>Search</span>
          <input
            className={styles.input}
            type="search"
            value={filters.search}
            placeholder="e.g. settlement, NVDA, drawdown"
            onChange={(event) => {
              set('search', event.target.value);
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Type</span>
          <select
            className={styles.input}
            value={filters.category}
            onChange={(event) => {
              const next = AuditCategorySchema.options.find((item) => item === event.target.value);
              set('category', next ?? ALL);
            }}
          >
            <option value={ALL}>All types</option>
            {AuditCategorySchema.options.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Triggered by</span>
          <select
            className={styles.input}
            value={filters.trigger}
            onChange={(event) => {
              const next = AuditTriggerSchema.options.find((item) => item === event.target.value);
              set('trigger', next ?? ALL);
            }}
          >
            <option value={ALL}>Anyone</option>
            {AuditTriggerSchema.options.map((item: AuditTriggerDto) => (
              <option key={item} value={item}>
                {TRIGGER_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>From</span>
          <input
            className={styles.input}
            type="date"
            value={filters.from}
            onChange={(event) => {
              set('from', event.target.value);
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>To</span>
          <input
            className={styles.input}
            type="date"
            value={filters.to}
            onChange={(event) => {
              set('to', event.target.value);
            }}
          />
        </label>
        <Button
          variant="secondary"
          onPress={() => {
            setFilters(DEFAULT_AUDIT_FILTERS);
          }}
        >
          Clear
        </Button>
      </div>

      {traced?.orderId != null && (
        <DecisionChain key={traced.id} orderId={traced.orderId} highlightAt={traced.at} />
      )}

      <p className={styles.meta}>
        {visible.length} of {entries.length} entries, newest first. Open a row for before and after
        values.
      </p>

      {visible.length === 0 ? (
        <NoResultsState
          title="Nothing matches"
          description="Try other words or widen the filters."
          onClearFilters={() => {
            setFilters(DEFAULT_AUDIT_FILTERS);
          }}
        />
      ) : (
        <DataTable
          data={[...visible]}
          columns={columns}
          getRowId={(entry) => entry.id}
          pageSize={20}
          renderRowDetails={(entry) => <Changes entry={entry} onTrace={setTraced} />}
        />
      )}
    </div>
  );
}
