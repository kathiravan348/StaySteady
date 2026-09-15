// Markets Screener screen (UI spec 8.3).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function MarketsScreenerPage(): ReactElement {
  return (
    <PageShell
      title="Instrument Screener"
      description="Filter instruments by fundamental ratios, technical signals, and market"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Markets', to: '/markets/watchlists' },
        { label: 'Screener' },
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
          Multi-parameter screener filter and sortable result table.
        </p>
      </div>
    </PageShell>
  );
}
