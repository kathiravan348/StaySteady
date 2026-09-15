// Markets Watchlists screen (UI spec 8.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function MarketsWatchlistsPage(): ReactElement {
  return (
    <PageShell
      title="Watchlists"
      description="Custom instrument watchlists across global markets"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Watchlists' }]}
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
          Multi-market price grids and custom alerts.
        </p>
      </div>
    </PageShell>
  );
}
