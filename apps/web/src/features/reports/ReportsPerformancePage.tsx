// Performance Reports screen (UI spec 14.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function ReportsPerformancePage(): ReactElement {
  return (
    <PageShell
      title="Performance Reports"
      description="Quarterly and annual return breakdowns, alpha generation, and benchmark tracking"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Reports' }]}
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
          Generated return reports and downloadable summaries.
        </p>
      </div>
    </PageShell>
  );
}
