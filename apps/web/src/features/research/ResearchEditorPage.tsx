// Strategy Editor screen (UI spec 10.2).

import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '../../shell/PageShell';

export function ResearchEditorPage(): ReactElement {
  const { id } = useParams<{ id?: string }>();

  return (
    <PageShell
      title={id ? `Edit Strategy: ${id}` : 'New Strategy Editor'}
      description="Define entry/exit conditions, position sizing, and stop loss rules"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Strategies', to: '/research/strategies' },
        { label: id ?? 'New' },
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
          Rule builder and parameter configuration workspace.
        </p>
      </div>
    </PageShell>
  );
}
