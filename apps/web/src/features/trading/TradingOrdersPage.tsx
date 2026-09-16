// Orders (UI spec 7.13): every order with who carried it, what it cost, and how it ended.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useOrderHistory } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { OrdersView } from './orders/sections/OrdersView';

function OrdersBody(): ReactElement {
  const history = useOrderHistory();

  if (history.isError) {
    return (
      <ErrorState
        title="Order history unavailable"
        message={history.error.message}
        onRetry={() => {
          void history.refetch();
        }}
      />
    );
  }
  if (history.data === undefined) {
    return <LoadingState layout="table" count={7} />;
  }
  if (history.data.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Orders placed by hand or by a strategy appear here with their full lifecycle."
      />
    );
  }
  return <OrdersView entries={history.data} />;
}

export function TradingOrdersPage(): ReactElement {
  return (
    <PageShell
      title="Orders"
      description="Every order with its broker, fill, slippage and fees. Open a row for its full lifecycle."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Approvals', to: ROUTES.TRADING_APPROVALS },
        { label: 'Orders' },
      ]}
    >
      <OrdersBody />
    </PageShell>
  );
}
