// System Alerts & Notifications screen (UI spec 5).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function AlertsPage(): ReactElement {
  return (
    <PageShell
      title="Alerts & Notifications"
      description="Risk warnings, market notifications, and system incident alerts"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Alerts' }]}
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
          Active alert stream with severity filters (low, medium, high, critical).
        </p>
      </div>
    </PageShell>
  );
}
