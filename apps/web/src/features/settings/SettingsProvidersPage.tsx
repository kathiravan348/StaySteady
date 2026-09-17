// Data providers configuration (UI spec 7.18): coverage, granularity, history depth, rate limits,
// cost, priority order, credential reference, health check and freshness expectation, each change
// saved as a version, with a connection test.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useMarketConfigs, useProviderConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { ProvidersView } from './providers/sections/ProvidersView';
import { SettingsNav } from './sections/SettingsNav';

function ProvidersBody(): ReactElement {
  const providers = useProviderConfigs();
  // Coverage is chosen from the configured markets, so both screens name the same markets.
  const markets = useMarketConfigs();

  const failed = providers.isError ? providers : markets.isError ? markets : null;
  if (failed !== null) {
    return (
      <ErrorState
        title="Provider configuration unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void providers.refetch();
          void markets.refetch();
        }}
      />
    );
  }
  if (providers.data === undefined || markets.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  if (providers.data.length === 0) {
    return (
      <EmptyState
        title="No data providers configured"
        description="Add a provider to collect prices, rates or news. It starts in simulation."
      />
    );
  }
  return <ProvidersView entries={providers.data} markets={markets.data} />;
}

export function SettingsProvidersPage(): ReactElement {
  return (
    <PageShell
      title="Data providers"
      description="Where market data, rates and news come from, what each costs and allows, and the order they are asked in. Every change is kept as a version."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Data providers' },
      ]}
    >
      <SettingsNav />
      <ProvidersBody />
    </PageShell>
  );
}
