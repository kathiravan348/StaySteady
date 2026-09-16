import { Badge, Button, NoResultsState, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { RiskBreachDto } from '../../../data/schemas';
import { formatDateTime } from '../../../shared/format';
import styles from '../Risk.module.scss';

type Show = 'all' | 'open' | 'closed';

const MINUTE_MS = 60_000;

function duration(breach: RiskBreachDto, nowMs: number): string {
  const end = breach.endedAt === null ? nowMs : new Date(breach.endedAt).getTime();
  const minutes = Math.max(0, Math.round((end - new Date(breach.startedAt).getTime()) / MINUTE_MS));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return `${String(days)}d ${String(hours)}h`;
  if (hours > 0) return `${String(hours)}h ${String(rest)}m`;
  return `${String(rest)}m`;
}

// UI spec 7.14 — breach history with cause, time, what was halted and how it resolved.
export function BreachHistoryView({
  breaches,
}: {
  readonly breaches: readonly RiskBreachDto[];
}): ReactElement {
  const [show, setShow] = useState<Show>('all');
  const [nowMs] = useState(() => Date.now());
  const open = breaches.filter((breach) => breach.endedAt === null).length;
  const visible = breaches.filter((breach) =>
    show === 'all' ? true : show === 'open' ? breach.endedAt === null : breach.endedAt !== null,
  );

  return (
    <div className={styles.page}>
      <div className={styles.inline}>
        <Badge variant={open > 0 ? 'critical' : 'positive'}>
          {open === 0 ? 'Nothing is in breach' : `${String(open)} still in breach`}
        </Badge>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Show</span>
          <select
            className={styles.input}
            value={show}
            onChange={(event) => {
              setShow(event.target.value as Show);
            }}
          >
            <option value="all">All breaches</option>
            <option value="open">Still in breach</option>
            <option value="closed">Resolved</option>
          </select>
        </label>
        <span className={styles.meta}>
          Showing {visible.length} of {breaches.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <NoResultsState
          title="No breaches to show"
          description="Nothing matches this view."
          action={
            <Button
              variant="secondary"
              onPress={() => {
                setShow('all');
              }}
            >
              Show all
            </Button>
          }
        />
      ) : (
        <ul className={styles.list}>
          {visible.map((breach) => {
            const isOpen = breach.endedAt === null;
            return (
              <li
                key={breach.id}
                className={cx(styles.breach, isOpen ? styles.breachOpen : undefined)}
              >
                <div className={styles.breachHead}>
                  <span className={styles.title}>{breach.title}</span>
                  <Badge variant={isOpen ? 'critical' : 'neutral'}>
                    {isOpen ? 'Still in breach' : 'Resolved'}
                  </Badge>
                  {breach.severity === 'warning' && <Badge variant="warning">Warning</Badge>}
                </div>
                <span className={styles.fact}>
                  <span className={styles.factLabel}>Cause</span>
                  <p className={styles.factValue}>{breach.cause}</p>
                </span>
                <span className={styles.fact}>
                  <span className={styles.factLabel}>When</span>
                  <p className={styles.factValue}>
                    {formatDateTime(breach.startedAt)}
                    {isOpen ? ' · ongoing for ' : ' · lasted '}
                    {duration(breach, nowMs)}
                  </p>
                </span>
                <span className={styles.fact}>
                  <span className={styles.factLabel}>What was halted</span>
                  <p className={styles.factValue}>{breach.halted}</p>
                </span>
                <span className={styles.fact}>
                  <span className={styles.factLabel}>Resolution</span>
                  <p className={styles.factValue}>{breach.resolution}</p>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
