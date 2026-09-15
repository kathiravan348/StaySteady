// Approval Queue screen (UI spec 11.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function TradingApprovalsPage(): ReactElement {
  return (
    <PageShell
      title="Trade Approval Queue"
      description="Orders pending owner review before dispatch to execution layer"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Trading', to: '/trading/orders' },
        { label: 'Approvals' },
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
          Manual approval queue for semi-automated execution modes.
        </p>
      </div>
    </PageShell>
  );
}
