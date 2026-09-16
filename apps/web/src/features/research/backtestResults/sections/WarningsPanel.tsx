import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ResultWarning, ResultWarningLevel } from '../model/resultWarnings';
import styles from '../BacktestResults.module.scss';

export interface WarningsPanelProps {
  readonly warnings: readonly ResultWarning[];
}

const LEVEL_META: Readonly<
  Record<
    ResultWarningLevel,
    {
      readonly label: string;
      readonly icon: string;
      readonly variant: 'critical' | 'warning' | 'neutral';
    }
  >
> = {
  critical: { label: 'Read this first', icon: '✕', variant: 'critical' },
  warning: { label: 'Caution', icon: '▲', variant: 'warning' },
  note: { label: 'Note', icon: '■', variant: 'neutral' },
};

// UI spec 7.10 — the warnings panel stays visible on every tab, not hidden behind one.
export function WarningsPanel({ warnings }: WarningsPanelProps): ReactElement {
  return (
    <Card title="What could make this result misleading">
      {warnings.length === 0 ? (
        <p className={styles.note}>
          Nothing stands out: the trade count, cost assumptions and out-of-sample period all look
          reasonable. A backtest is still not a promise about the future.
        </p>
      ) : (
        <ul className={styles.warningList}>
          {warnings.map((warning) => {
            const meta = LEVEL_META[warning.level];
            return (
              <li key={warning.id} className={styles.warningRow}>
                <Badge variant={meta.variant}>
                  <span aria-hidden="true">{meta.icon}</span> {meta.label}
                </Badge>
                <span className={styles.stack}>
                  <strong>{warning.title}</strong>
                  <span className={styles.meta}>{warning.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
