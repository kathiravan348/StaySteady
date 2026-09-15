// Data Providers screen (UI spec 16.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function SettingsProvidersPage(): ReactElement {
  return (
    <PageShell
      title="Data Providers & Brokers"
      description="Integration endpoints, fallback priority tiers, and connection status"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Settings' },
        { label: 'Providers' },
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
          Market data providers, news ingestion feeds, and broker endpoints.
        </p>
      </div>
    </PageShell>
  );
}
