// Position Detail screen (UI spec 7.3): everything about one held instrument.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ROUTES, workspaceTickerPath } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './position/PositionPage.module.scss';
import { PositionView } from './position/sections/PositionView';
import type { PositionState } from './position/usePositionData';
import { usePositionData } from './position/usePositionData';

function renderPosition(state: PositionState): ReactElement {
  switch (state.status) {
    case 'loading':
      return <LoadingState layout="table" count={6} />;
    case 'error':
      return (
        <ErrorState title="Position unavailable" message={state.message} onRetry={state.retry} />
      );
    case 'unknown':
      return (
        <EmptyState
          title="Instrument not found"
          description={`No instrument has the id "${state.instrumentId}".`}
          action={
            <Link to={ROUTES.PORTFOLIO_HOLDINGS} className={styles.link}>
              Back to holdings
            </Link>
          }
        />
      );
    case 'not-held':
      return (
        <EmptyState
          title={`You do not hold ${state.instrument.symbol}`}
          description={`${state.instrument.name} is not in your portfolio. Research it in the instrument workspace.`}
          action={
            <Link to={workspaceTickerPath(state.instrument.symbol)} className={styles.link}>
              Open {state.instrument.symbol} in the workspace
            </Link>
          }
        />
      );
    case 'ready':
      return (
        <PositionView
          row={state.row}
          baseCurrency={state.baseCurrency}
          heldMarketIds={state.heldMarketIds}
          oldestQuoteTimestamp={state.oldestQuoteTimestamp}
          unavailable={state.unavailable}
          onRetry={state.retry}
        />
      );
  }
}

function titleFor(state: PositionState): { readonly title: string; readonly description: string } {
  switch (state.status) {
    case 'ready':
      return {
        title: `${state.row.instrument.symbol} position`,
        description: `${state.row.instrument.name} · ${state.row.marketName}`,
      };
    case 'not-held':
      return { title: state.instrument.symbol, description: state.instrument.name };
    case 'loading':
    case 'error':
    case 'unknown':
      return { title: 'Position', description: 'Everything about one held instrument.' };
  }
}

export function PositionDetailPage(): ReactElement {
  const { id = '' } = useParams<{ id: string }>();
  const state = usePositionData(id);
  const { title, description } = titleFor(state);

  return (
    <PageShell
      title={title}
      description={description}
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Holdings', to: ROUTES.PORTFOLIO_HOLDINGS },
        { label: title },
      ]}
    >
      {renderPosition(state)}
    </PageShell>
  );
}
