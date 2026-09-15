// Backtest Results screen (UI spec 10.4).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function BacktestResultsPage(): ReactElement {
  return (
    <PageShell
      title="Backtest Results"
      description="Historical simulation curves, trade distribution, CAGR, and drawdowns"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Research', to: '/research/strategies' },
        { label: 'Backtests' },
      ]}
    >
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border-width-thin) solid var(--border-subtle)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Simulation equity curves, win/loss stats, and risk-adjusted metrics.
        </p>
      </div>
    </PageShell>
  );
}
