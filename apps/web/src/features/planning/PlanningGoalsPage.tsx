// Goals Planning screen (UI spec 15.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function PlanningGoalsPage(): ReactElement {
  return (
    <PageShell
      title="Financial Goals & Milestones"
      description="Long-term wealth targets, retirement corpus projection, and cash-flow horizons"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Planning', to: '/planning/allocation' },
        { label: 'Goals' },
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
          Goal trajectory simulators and milestone tracker.
        </p>
      </div>
    </PageShell>
  );
}
