// Summary statistics card row for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { FC } from 'react';

import type { ScreenerSummaryMetrics } from '../../../../data/schemas/screener';
import styles from '../Screener.module.scss';

export interface ScreenerMetricsSummaryProps {
  readonly summary: ScreenerSummaryMetrics;
}

export const ScreenerMetricsSummary: FC<ScreenerMetricsSummaryProps> = ({ summary }) => {
  return (
    <div className={styles.gridFour}>
      <div className={styles.metricCard}>
        <span className={styles.metricLabel}>Total Universe</span>
        <span className={styles.metricValue}>{summary.universeCount} Instruments</span>
      </div>

      <div className={styles.metricCard}>
        <span className={styles.metricLabel}>Passing Filters</span>
        <span className={styles.metricValue}>{summary.matchedCount} Matches</span>
      </div>

      <div className={styles.metricCard}>
        <span className={styles.metricLabel}>Median P/E Ratio</span>
        <span className={styles.metricValue}>
          {summary.medianPe !== null ? `${summary.medianPe.toFixed(1)}x` : '—'}
        </span>
      </div>

      <div className={styles.metricCard}>
        <span className={styles.metricLabel}>Median ROE</span>
        <span className={styles.metricValue}>
          {summary.medianRoePct !== null ? `${summary.medianRoePct.toFixed(1)}%` : '—'}
        </span>
      </div>
    </div>
  );
};
