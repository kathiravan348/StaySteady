// Backtest Comparison screen (UI spec 10.5).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function BacktestComparePage(): ReactElement {
  return (
    <PageShell
      title="Strategy Comparison"
      description="Side-by-side performance, correlation matrix, and rolling metrics"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Research', to: '/research/strategies' },
        { label: 'Compare' },
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
          Multi-strategy comparative charts and metric matrices.
        </p>
      </div>
    </PageShell>
  );
}
