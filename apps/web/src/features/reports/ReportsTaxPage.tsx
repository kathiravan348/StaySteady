// Tax Summaries screen (UI spec 14.3).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function ReportsTaxPage(): ReactElement {
  return (
    <PageShell
      title="Tax Lot & Capital Gains Summary"
      description="Short-term vs long-term capital gains, tax loss harvesting, and cross-border withholdings"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Reports', to: '/reports/performance' },
        { label: 'Tax' },
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
          Jurisdiction-specific tax liabilities and harvesting opportunities.
        </p>
      </div>
    </PageShell>
  );
}
