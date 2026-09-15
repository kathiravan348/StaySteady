// Portfolio Transactions screen (UI spec 7.4).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function PortfolioTransactionsPage(): ReactElement {
  return (
    <PageShell
      title="Transactions"
      description="Trade history, dividends, deposits and corporate actions"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Portfolio', to: '/portfolio/holdings' },
        { label: 'Transactions' },
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
          Historical transaction ledger and corporate actions.
        </p>
      </div>
    </PageShell>
  );
}
