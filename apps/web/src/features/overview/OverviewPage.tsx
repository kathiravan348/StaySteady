// Overview landing screen (UI spec 7.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';
import { useSystemState } from '../../providers/SystemStateProvider';
import { createMoney, calculateGainLoss } from '../../shared/money';
import { formatMoney, formatGainLossCombined } from '../../shared/format';
import styles from './OverviewPage.module.scss';

export function OverviewPage(): ReactElement {
  const { baseCurrency, mode } = useSystemState();

  const totalValue = createMoney('125430.50', baseCurrency);
  const costBasis = createMoney('118200.00', baseCurrency);
  const totalReturn = calculateGainLoss(totalValue, costBasis);

  return (
    <PageShell
      title="Platform Overview"
      description="Personal multi-market investment tracking, live signals, and safety posture"
      breadcrumbs={[{ label: 'Home', to: '/overview' }, { label: 'Overview' }]}
    >
      <section className={styles.metricsGrid} aria-label="Key Portfolio Metrics">
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Portfolio Value</span>
          <div className={styles.metricValue}>
            {formatMoney(totalValue, { showCurrency: 'both' })}
          </div>
          <span className={styles.metricSubtitle}>Across 4 active broker accounts</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Unrealised Return</span>
          <div className={`${styles.metricValue} ${styles[totalReturn.direction]}`}>
            {formatGainLossCombined(totalReturn)}
          </div>
          <span className={styles.metricSubtitle}>Cost basis: {formatMoney(costBasis)}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Automation Posture</span>
          <div className={`${styles.metricValue} ${styles.simulation}`}>
            {mode.replace('-', ' ')}
          </div>
          <span className={styles.metricSubtitle}>Gate checks active • 0 breach events</span>
        </div>
      </section>

      <section className={styles.infoCard}>
        <h2>System Foundations Active</h2>
        <p>
          Stage F Foundations completed: Branded domain types for instruments, timestamps and
          quantities, arbitrary-precision financial arithmetic with Decimal.js, multi-timezone
          session models, accessible responsive shell, and full application routing structure.
        </p>
        <div className={styles.pillList}>
          <span className={styles.featurePill}>✨ Branded Domain Types</span>
          <span className={styles.featurePill}>🧮 Arbitrary Precision Decimal Arithmetic</span>
          <span className={styles.featurePill}>🌍 Multi-Timezone Market Clocks</span>
          <span className={styles.featurePill}>
            🎨 Acrylic Theme Tokens (Dark / Light / High-Contrast)
          </span>
          <span className={styles.featurePill}>🧭 Full Section 6 Navigation Structure</span>
        </div>
      </section>
    </PageShell>
  );
}
