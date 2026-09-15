// Watchlists screen (UI spec 7.5): named lists of instruments across countries and types.

import { ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { WatchlistsView } from './watchlists/sections/WatchlistsView';
import { useWatchlistsData } from './watchlists/useWatchlistsData';

export function MarketsWatchlistsPage(): ReactElement {
  const state = useWatchlistsData();

  let body: ReactElement;
  switch (state.status) {
    case 'loading':
      body = <LoadingState layout="table" count={6} />;
      break;
    case 'error':
      body = (
        <ErrorState title="Watchlists unavailable" message={state.message} onRetry={state.retry} />
      );
      break;
    case 'ready':
      body = (
        <WatchlistsView
          lists={state.lists}
          instruments={state.instruments}
          markets={state.markets}
          refreshError={state.refreshError}
        />
      );
      break;
  }

  return (
    <PageShell
      title="Watchlists"
      description="Instruments you follow, across markets and instrument types, with live prices."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Watchlists' }]}
    >
      {body}
    </PageShell>
  );
}
