// Countries and markets configuration (UI spec 7.18): identity, hours, holidays, settlement, fees,
// tax rules, permitted instrument types and automation, each change saved as a version.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useMarketConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { MarketsView } from './markets/sections/MarketsView';
import { SettingsNav } from './sections/SettingsNav';

function MarketsBody(): ReactElement {
  const markets = useMarketConfigs();

  if (markets.isError) {
    return (
      <ErrorState
        title="Market configuration unavailable"
        message={markets.error.message}
        onRetry={() => {
          void markets.refetch();
        }}
      />
    );
  }
  if (markets.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  if (markets.data.length === 0) {
    return (
      <EmptyState
        title="No markets configured"
        description="Add a market to trade in it. It starts in simulation."
      />
    );
  }
  return <MarketsView entries={markets.data} />;
}

export function SettingsMarketsPage(): ReactElement {
  return (
    <PageShell
      title="Countries & markets"
      description="How each market trades, settles, charges and taxes, and whether automation may trade there. Every change is kept as a version."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Countries & markets' },
      ]}
    >
      <SettingsNav />
      <MarketsBody />
    </PageShell>
  );
}
