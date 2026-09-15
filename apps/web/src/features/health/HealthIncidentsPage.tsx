// System Health Incidents screen (UI spec 13.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function HealthIncidentsPage(): ReactElement {
  return (
    <PageShell
      title="Incident History"
      description="Service degradation events, network drops, and automated recovery logs"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Health', to: '/health/status' },
        { label: 'Incidents' },
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
          Historical downtime records and resolution timeline.
        </p>
      </div>
    </PageShell>
  );
}
