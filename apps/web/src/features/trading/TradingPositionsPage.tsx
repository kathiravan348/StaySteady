// Trading Positions (nav map 6; open question 10, recommended option): positions a strategy opened,
// seen from the automation's side. Holdings lists everything owned.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './positions/Positions.module.scss';
import { PositionsView } from './positions/sections/PositionsView';
import { usePositionsData } from './positions/usePositionsData';

function PositionsBody(): ReactElement {
  const state = usePositionsData();
  switch (state.status) {
    case 'loading':
      return <LoadingState layout="table" count={4} />;
    case 'error':
      return (
        <ErrorState title="Positions unavailable" message={state.message} onRetry={state.retry} />
      );
    case 'empty':
      return (
        <EmptyState
          title="No automated positions"
          description="Positions appear here once a semi-automatic or fully automatic strategy opens one. Positions you opened yourself are in Holdings."
          action={
            <Link to={ROUTES.PORTFOLIO_HOLDINGS} className={styles.link}>
              Open Holdings
            </Link>
          }
        />
      );
    case 'ready':
      return (
        <PositionsView
          rows={state.rows}
          baseCurrency={state.baseCurrency}
          heldMarketIds={state.heldMarketIds}
          oldestQuoteTimestamp={state.oldestQuoteTimestamp}
          ordersUnavailable={state.ordersUnavailable}
        />
      );
  }
}

export function TradingPositionsPage(): ReactElement {
  return (
    <PageShell
      title="Positions"
      description="Positions opened by strategies: what happens at each stop, how far away it is, and what is still working."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Orders', to: ROUTES.TRADING_ORDERS },
        { label: 'Positions' },
      ]}
    >
      <PositionsBody />
    </PageShell>
  );
}
