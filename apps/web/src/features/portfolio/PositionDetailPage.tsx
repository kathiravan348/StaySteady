// Position Detail screen (UI spec 7.3).

import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '../../shell/PageShell';

export function PositionDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();

  return (
    <PageShell
      title={`Position Detail: ${id ?? ''}`}
      description="Lot-level tax lots, cost basis, realized gains, and orders"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Holdings', to: '/portfolio/holdings' },
        { label: id ?? 'Position' },
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
          Lot-level history and position analytics for {id}.
        </p>
      </div>
    </PageShell>
  );
}
