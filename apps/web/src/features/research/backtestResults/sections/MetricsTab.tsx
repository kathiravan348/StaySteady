import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { BacktestDetailDto } from '../../../../data/schemas';
import styles from '../BacktestResults.module.scss';

export interface MetricsTabProps {
  readonly detail: BacktestDetailDto;
}

// UI spec 8.2 — the full metric table by category; every metric explains itself and says what it
// does not tell you.
export function MetricsTab({ detail }: MetricsTabProps): ReactElement {
  return (
    <div className={styles.cardGrid}>
      {detail.metricGroups.map((group) => (
        <Card key={group.id} title={group.title}>
          <dl className={styles.metricList}>
            {group.metrics.map((metric) => (
              <div key={metric.id} className={styles.metricRow}>
                <dt className={styles.metricLabel}>{metric.label}</dt>
                <dd className={styles.metricValue}>{metric.value}</dd>
                <dd className={styles.metricExplanation}>
                  {metric.explanation}
                  {metric.limitation !== null && (
                    <>
                      {' '}
                      <em className={styles.limitation}>{metric.limitation}</em>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
}
