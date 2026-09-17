// Portfolio Holdings screen (UI spec 7.2): complete list of everything currently held.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './holdings/HoldingsPage.module.scss';
import { HoldingsView } from './holdings/sections/HoldingsView';
import type { HoldingsState } from './holdings/useHoldingsData';
import { useHoldingsData } from './holdings/useHoldingsData';

function renderHoldings(state: HoldingsState): ReactElement {
  switch (state.status) {
    case 'loading':
      return <LoadingState layout="table" count={7} />;
    case 'error':
      return (
        <ErrorState title="Holdings unavailable" message={state.message} onRetry={state.retry} />
      );
    case 'empty':
      return (
        <EmptyState
          title="No holdings yet"
          description="Add a holding manually or import your broker transactions to see everything you hold here."
          action={
            <Link to={ROUTES.PORTFOLIO_TRANSACTIONS} className={styles.emptyAction}>
              Add or import holdings
            </Link>
          }
        />
      );
    case 'ready':
      return (
        <HoldingsView
          rows={state.rows}
          baseCurrency={state.baseCurrency}
          heldMarketIds={state.heldMarketIds}
          oldestQuoteTimestamp={state.oldestQuoteTimestamp}
          unavailable={state.unavailable}
          onRetry={state.retry}
        />
      );
  }
}

export function PortfolioHoldingsPage(): ReactElement {
  const state = useHoldingsData();

  return (
    <PageShell
      title="Holdings"
      description="Everything you hold, across markets, currencies and brokers."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Holdings' }]}
    >
      {renderHoldings(state)}
    </PageShell>
  );
}
