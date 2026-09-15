// System Health Status screen (UI spec 13.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function HealthStatusPage(): ReactElement {
  return (
    <PageShell
      title="System Health & Watchdog"
      description="Real-time uptime, collector latency, and service heartbeat status"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'System Health' }]}
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
          Service watchdog metrics for ingestion, strategy engines, and brokers.
        </p>
      </div>
    </PageShell>
  );
}
