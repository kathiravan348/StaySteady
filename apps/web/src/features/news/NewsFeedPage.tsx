// News Feed screen (UI spec 9.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function NewsFeedPage(): ReactElement {
  return (
    <PageShell
      title="Live News & Sentiment"
      description="Scored news feeds, filings, and earnings announcements"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'News Feed' }]}
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
          Market intelligence feed and sentiment analysis tags.
        </p>
      </div>
    </PageShell>
  );
}
