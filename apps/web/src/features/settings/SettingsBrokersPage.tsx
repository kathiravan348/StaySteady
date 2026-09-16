// Brokers configuration (UI spec 7.18): markets, instrument types, capabilities, order types,
// simulation availability, fees, credentials and automation per instrument type, each change saved as
// a version, with a read-only connection test.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useBrokerConfigs, useMarketConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { BrokersView } from './brokers/sections/BrokersView';

function BrokersBody(): ReactElement {
  const brokers = useBrokerConfigs();
  // Markets are chosen from the market configuration, which also says where automation is allowed.
  const markets = useMarketConfigs();

  const failed = brokers.isError ? brokers : markets.isError ? markets : null;
  if (failed !== null) {
    return (
      <ErrorState
        title="Broker configuration unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void brokers.refetch();
          void markets.refetch();
        }}
      />
    );
  }
  if (brokers.data === undefined || markets.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  if (brokers.data.length === 0) {
    return (
      <EmptyState
        title="No brokers configured"
        description="Add a broker to track its holdings. It starts in simulation."
      />
    );
  }
  return <BrokersView entries={brokers.data} markets={markets.data} />;
}

export function SettingsBrokersPage(): ReactElement {
  return (
    <PageShell
      title="Brokers"
      description="Where holdings are kept and orders can go: what each broker trades, what it can do, what it charges, and where automation is allowed. Every change is kept as a version."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Brokers' },
      ]}
    >
      <BrokersBody />
    </PageShell>
  );
}
