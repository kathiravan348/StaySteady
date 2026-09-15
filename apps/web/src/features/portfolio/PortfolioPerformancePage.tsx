// Portfolio Performance screen (UI spec 7.5).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function PortfolioPerformancePage(): ReactElement {
  return (
    <PageShell
      title="Performance Analytics"
      description="Time-weighted returns, benchmark comparisons, and drawdowns"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Portfolio', to: '/portfolio/holdings' },
        { label: 'Performance' },
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
          Performance curves, Sharpe ratio, and drawdown watermarks.
        </p>
      </div>
    </PageShell>
  );
}
