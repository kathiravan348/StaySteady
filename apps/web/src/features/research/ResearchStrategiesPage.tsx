// Strategy Library screen (UI spec 10.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function ResearchStrategiesPage(): ReactElement {
  return (
    <PageShell
      title="Strategy Library"
      description="Systematic investment algorithms, signal models, and portfolio rebalancers"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Strategies' }]}
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
          Configured strategy models, validation statuses, and active capital allocations.
        </p>
      </div>
    </PageShell>
  );
}
