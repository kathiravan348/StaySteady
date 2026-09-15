// Orders screen (UI spec 11.3).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function TradingOrdersPage(): ReactElement {
  return (
    <PageShell
      title="Orders & Executions"
      description="Active, filled, cancelled, and rejected orders across brokers"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Orders' }]}
    >
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border-width-thin) solid var(--border-subtle)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Live order book and execution audit trail.</p>
      </div>
    </PageShell>
  );
}
