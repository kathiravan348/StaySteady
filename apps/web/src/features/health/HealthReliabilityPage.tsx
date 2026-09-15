// Provider & Broker Reliability screen (UI spec 13.3).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function HealthReliabilityPage(): ReactElement {
  return (
    <PageShell
      title="Provider & Broker Reliability"
      description="API latency percentiles, error rates, and quota consumption stats"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Health', to: '/health/status' },
        { label: 'Reliability' },
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
          External data provider SLAs and rate limit tracking.
        </p>
      </div>
    </PageShell>
  );
}
