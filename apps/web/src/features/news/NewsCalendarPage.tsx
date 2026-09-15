// Event Calendar screen (UI spec 9.2).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function NewsCalendarPage(): ReactElement {
  return (
    <PageShell
      title="Corporate Actions & Event Calendar"
      description="Earnings dates, dividend record dates, stock splits, and economic data releases"
      breadcrumbs={[
        { label: 'Overview', to: '/overview' },
        { label: 'News', to: '/news/feed' },
        { label: 'Calendar' },
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
          Market event calendar with country filtering.
        </p>
      </div>
    </PageShell>
  );
}
