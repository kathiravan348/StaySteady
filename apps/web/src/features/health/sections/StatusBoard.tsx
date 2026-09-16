import { Badge, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useComponentHealth } from '../../../data/api';
import type { ComponentHealthDto } from '../../../data/schemas';
import { formatDateTime } from '../../../shared/format';
import { KIND_LABELS, sortByUrgency, STATUS_META, summariseComponents } from '../model/healthModel';
import { formatAge } from '../model/healthModel';
import styles from '../Health.module.scss';
import { useNow } from '../useNow';

function ComponentTile({
  component,
  now,
}: {
  readonly component: ComponentHealthDto;
  readonly now: number;
}): ReactElement {
  const meta = STATUS_META[component.status];
  const lastSuccessAge =
    component.lastSuccessAt === null
      ? null
      : formatAge(Math.max(0, Math.round((now - Date.parse(component.lastSuccessAt)) / 1000)));

  return (
    <li className={`${styles.tile} ${styles[`tile-${component.status}`] ?? ''}`}>
      <div className={styles.tileHeader}>
        <span className={styles.stack}>
          <h3 className={styles.tileTitle}>{component.name}</h3>
          <span className={styles.meta}>{KIND_LABELS[component.kind]}</span>
        </span>
        <Badge variant={meta.variant}>
          <span aria-hidden="true">{meta.icon}</span> {meta.label}
        </Badge>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>Last successful check</dt>
          <dd
            title={
              component.lastSuccessAt === null ? undefined : formatDateTime(component.lastSuccessAt)
            }
          >
            {lastSuccessAge === null ? 'Never since start-up' : `${lastSuccessAge} ago`}
          </dd>
        </div>
        <div>
          <dt>Response time</dt>
          <dd>
            {component.responseTimeMs === null ? 'No response' : `${component.responseTimeMs} ms`}
          </dd>
        </div>
        <div className={styles.issue}>
          <dt>Current issue</dt>
          <dd>{component.issue ?? 'None'}</dd>
        </div>
      </dl>
    </li>
  );
}

// UI spec 7.15 — one tile per monitored component, most urgent first.
export function StatusBoard(): ReactElement {
  const components = useComponentHealth();
  const now = useNow();

  if (components.data === undefined) {
    return components.isError ? (
      <ErrorState
        title="Health checks unavailable"
        message={`The watchdog could not be reached: ${components.error.message}`}
        onRetry={() => {
          void components.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={6} />
    );
  }

  const summary = summariseComponents(components.data);
  const overall = STATUS_META[summary.overall];
  return (
    <section className={styles.section} aria-labelledby="status-board-title">
      <div
        className={`${styles.summary} ${styles[`summary-${summary.overall}`] ?? ''}`}
        role="status"
      >
        <h2 id="status-board-title" className={styles.summaryTitle}>
          <span aria-hidden="true">{overall.icon}</span>{' '}
          {summary.overall === 'healthy'
            ? 'All systems healthy'
            : `${summary.down} down, ${summary.degraded} degraded`}
        </h2>
        <span className={styles.meta}>
          {summary.healthy} of {components.data.length} components healthy · checked every 15 s ·
          updated {formatAge(Math.max(0, Math.round((now - components.dataUpdatedAt) / 1000)))} ago
        </span>
        {components.isError && (
          <span className={styles.warningText}>
            Latest check failed ({components.error.message}); showing the last known status.
          </span>
        )}
      </div>
      <ul className={styles.tiles}>
        {sortByUrgency(components.data).map((component) => (
          <ComponentTile key={component.id} component={component} now={now} />
        ))}
      </ul>
    </section>
  );
}
