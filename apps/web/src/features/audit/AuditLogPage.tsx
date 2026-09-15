// Platform Audit Log screen (UI spec 6).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function AuditLogPage(): ReactElement {
  return (
    <PageShell
      title="Audit Trail"
      description="Immutable ledger of user actions, strategy deployments, and order submissions"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Audit Log' }]}
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
          Append-only security log recording timestamped events and changes.
        </p>
      </div>
    </PageShell>
  );
}
