// Instrument Workspace screen (UI spec 7.4): the research and analysis chart screen.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { WorkspaceView } from './workspace/sections/WorkspaceView';
import { useWorkspaceInstrument } from './workspace/useWorkspaceData';
import styles from './workspace/WorkspacePage.module.scss';

const DEFAULT_TICKER = 'SPY';

export function MarketsWorkspacePage(): ReactElement {
  const { ticker = DEFAULT_TICKER } = useParams<{ ticker?: string }>();
  const state = useWorkspaceInstrument(ticker);
  const title =
    state.status === 'ready' ? `${state.instrument.symbol} workspace` : 'Instrument workspace';
  const description =
    state.status === 'ready'
      ? `${state.instrument.name} · ${state.market?.name ?? state.instrument.marketId} · ${state.instrument.currency}`
      : 'Charts, indicators and research for one instrument.';

  let body: ReactElement;
  switch (state.status) {
    case 'loading':
      body = <LoadingState layout="table" count={8} />;
      break;
    case 'error':
      body = (
        <ErrorState title="Workspace unavailable" message={state.message} onRetry={state.retry} />
      );
      break;
    case 'not-found':
      body = (
        <EmptyState
          title={`No instrument called ${state.ticker}`}
          description="Check the symbol, or pick an instrument from your watchlists."
          action={
            <Link to={ROUTES.MARKETS_WATCHLISTS} className={styles.link}>
              Open watchlists
            </Link>
          }
        />
      );
      break;
    case 'ready':
      body = (
        <WorkspaceView
          instrument={state.instrument}
          market={state.market}
          instruments={state.instruments}
          markets={state.markets}
        />
      );
      break;
  }

  return (
    <PageShell
      title={title}
      description={description}
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Markets', to: ROUTES.MARKETS_WATCHLISTS },
        { label: state.status === 'ready' ? state.instrument.symbol : ticker },
      ]}
    >
      {body}
    </PageShell>
  );
}
