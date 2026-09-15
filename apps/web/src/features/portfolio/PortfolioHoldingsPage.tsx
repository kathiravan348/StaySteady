// Portfolio Holdings screen (UI spec 7.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function PortfolioHoldingsPage(): ReactElement {
  return (
    <PageShell
      title="Portfolio Holdings"
      description="Consolidated assets across all accounts and asset classes"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Holdings' }]}
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
          Holdings data table and summary allocation view will connect to mock layer in Stage M.
        </p>
      </div>
    </PageShell>
  );
}
