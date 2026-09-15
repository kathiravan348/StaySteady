// Scenario Modelling screen (UI spec 15.3).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function PlanningScenariosPage(): ReactElement {
  return (
    <PageShell
      title="Scenario Modelling & Stress Testing"
      description="What-if macro scenarios, interest rate shifts, and severe drawdown impacts"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Planning', to: '/planning/allocation' },
        { label: 'Scenarios' },
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
          Macroeconomic stress tests and portfolio sensitivity graphs.
        </p>
      </div>
    </PageShell>
  );
}
