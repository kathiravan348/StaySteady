import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { pluralize } from '../../../../shared/format';
import type { CheckLevel, SetupCheck } from '../model/backtestWarnings';
import styles from '../BacktestSetup.module.scss';

export interface ChecksPanelProps {
  readonly checks: readonly SetupCheck[];
  readonly isLoading: boolean;
}

const LEVEL_META: Readonly<
  Record<
    CheckLevel,
    {
      readonly label: string;
      readonly icon: string;
      readonly variant: 'critical' | 'warning' | 'neutral';
    }
  >
> = {
  blocking: { label: 'Must fix', icon: '✕', variant: 'critical' },
  warning: { label: 'Warning', icon: '▲', variant: 'warning' },
  note: { label: 'Note', icon: '■', variant: 'neutral' },
};

const ORDER: readonly CheckLevel[] = ['blocking', 'warning', 'note'];

// UI spec 7.9 — everything worth knowing before the run, most serious first.
export function ChecksPanel({ checks, isLoading }: ChecksPanelProps): ReactElement {
  const sorted = [...checks].sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level));
  const blocking = checks.filter((check) => check.level === 'blocking').length;
  const warnings = checks.filter((check) => check.level === 'warning').length;

  return (
    <Card
      title="Before you run"
      extra={
        <span className={styles.note}>
          {blocking > 0
            ? `${pluralize(blocking, 'problem')} to fix`
            : warnings > 0
              ? `${pluralize(warnings, 'warning')}`
              : 'Nothing blocking'}
        </span>
      }
    >
      {isLoading && (
        <p className={styles.note} role="status">
          Checking data coverage…
        </p>
      )}
      {sorted.length === 0 ? (
        <p className={styles.note}>
          This range, universe and cost set look reasonable. Results still depend on the assumptions
          above.
        </p>
      ) : (
        <ul className={styles.checkList}>
          {sorted.map((check) => {
            const meta = LEVEL_META[check.level];
            return (
              <li key={check.id} className={styles.checkRow}>
                <Badge variant={meta.variant}>
                  <span aria-hidden="true">{meta.icon}</span> {meta.label}
                </Badge>
                <span className={styles.stack}>
                  <strong>{check.title}</strong>
                  <span className={styles.meta}>{check.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
