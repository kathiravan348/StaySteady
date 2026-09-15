// Allocation Targets screen (UI spec 15.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function PlanningAllocationPage(): ReactElement {
  return (
    <PageShell
      title="Asset Allocation & Rebalancing"
      description="Target weights across asset classes, geographic regions, and currencies"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Allocation' }]}
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
          Target allocation models and rebalancing drift triggers.
        </p>
      </div>
    </PageShell>
  );
}
