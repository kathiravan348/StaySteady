// Markets Workspace screen (UI spec 8.2).

import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '../../shell/PageShell';

export function MarketsWorkspacePage(): ReactElement {
  const { ticker } = useParams<{ ticker?: string }>();
  const activeTicker = ticker ?? 'AAPL';

  return (
    <PageShell
      title={`Instrument Workspace: ${activeTicker}`}
      description="Multi-timeframe candlestick chart, order book, and key ratios"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'Markets', to: '/markets/watchlists' },
        { label: activeTicker },
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
          Trading chart and instrument metrics workspace.
        </p>
      </div>
    </PageShell>
  );
}
