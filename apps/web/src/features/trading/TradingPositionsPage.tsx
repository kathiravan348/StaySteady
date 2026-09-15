// Trading Positions screen (UI spec 11.4).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function TradingPositionsPage(): ReactElement {
  return (
    <PageShell
      title="Trading Positions"
      description="Active algorithmic positions, stop levels, and profit targets"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Trading', to: '/trading/orders' },
        { label: 'Positions' },
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
          Algorithmic position monitor with real-time mark-to-market valuations.
        </p>
      </div>
    </PageShell>
  );
}
