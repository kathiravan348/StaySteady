// Placeholder for Credentials (S-28, UI spec 7.18: stored references only, never displayed, with
// expiry tracking and warnings).

import { EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';

export function SettingsCredentialsPage(): ReactElement {
  return (
    <PageShell
      title="Credentials"
      description="Stored credential references, never the values, with expiry tracking."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Credentials' },
      ]}
    >
      <EmptyState
        title="Credentials configuration is not built yet"
        description="This configuration area follows the same layout as markets, data providers and brokers."
      />
    </PageShell>
  );
}
