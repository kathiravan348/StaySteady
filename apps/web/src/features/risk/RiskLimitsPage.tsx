// Risk & Safety Limits screen (UI spec 12.1).

import type { ReactElement } from 'react';
import { PageShell } from '../../shell/PageShell';

export function RiskLimitsPage(): ReactElement {
  return (
    <PageShell
      title="Risk Limits & Gate Controls"
      description="Capital allocation ceilings, drawdown circuit breakers, and position concentration caps"
      breadcrumbs={[{ label: 'Overview', to: '/overview' }, { label: 'Risk Limits' }]}
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
          Safety thresholds and automated circuit breaker rules.
        </p>
      </div>
    </PageShell>
  );
}
