// Countries & Markets Configuration screen (UI spec 16.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function SettingsMarketsPage(): ReactElement {
  return (
    <PageShell
      title="Countries & Markets Configuration"
      description="Active trading venues, calendars, and regulatory compliance rules"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Settings' },
        { label: 'Markets' },
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
          Configured market definitions for US, India, UK, Japan, and Singapore.
        </p>
      </div>
    </PageShell>
  );
}
