// Placeholder for Brokers (S-17) and Credentials (S-28), which until session 38 rendered the data
// providers placeholder. Both are configuration areas under UI spec 7.18.

import { EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';

export function SettingsBrokersPage({
  area,
}: {
  readonly area: 'Brokers' | 'Credentials';
}): ReactElement {
  return (
    <PageShell
      title={area}
      description={
        area === 'Brokers'
          ? 'Broker connections: markets, instrument types, order types, fees and automation.'
          : 'Stored credential references, never the values, with expiry tracking.'
      }
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: area },
      ]}
    >
      <EmptyState
        title={`${area} configuration is not built yet`}
        description="This configuration area follows the same layout as markets and data providers."
      />
    </PageShell>
  );
}
