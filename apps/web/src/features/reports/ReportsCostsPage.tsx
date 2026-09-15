// Cost Analysis screen (UI spec 14.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function ReportsCostsPage(): ReactElement {
  return (
    <PageShell
      title="Cost & Slippage Analysis"
      description="Broker commissions, exchange fees, market impact, and FX friction breakdown"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Reports', to: '/reports/performance' },
        { label: 'Costs' },
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
          Execution fee drag and provider cost audit.
        </p>
      </div>
    </PageShell>
  );
}
