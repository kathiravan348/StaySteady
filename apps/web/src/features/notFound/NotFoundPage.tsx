// 404 Route Not Found page.

import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../shell/PageShell';

export function NotFoundPage(): ReactElement {
  return (
    <PageShell
      title="404 — Page Not Found"
      description="The requested page route does not exist in StaySteady."
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: '404' }]}
    >
      <div
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Please check the URL or use the navigation sidebar to return to an active section.
        </p>
        <Link
          to="/overview"
          style={{
            display: 'inline-block',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--interactive-primary)',
            color: 'var(--text-on-primary)',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Return to Overview
        </Link>
      </div>
    </PageShell>
  );
}
