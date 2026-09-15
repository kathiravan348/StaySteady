// Risk Breaches History screen (UI spec 12.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function RiskBreachesPage(): ReactElement {
  return (
    <PageShell
      title="Risk Breaches & Circuit Trips"
      description="Historical log of risk gate interventions, order blocks, and stop-loss triggers"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Risk', to: '/risk/limits' },
        { label: 'Breaches' },
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
        <p style={{ color: 'var(--text-secondary)' }}>Log of prevented orders and safety alerts.</p>
      </div>
    </PageShell>
  );
}
