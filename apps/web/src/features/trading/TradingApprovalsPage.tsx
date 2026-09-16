// Approval queue (UI spec 7.12): the screen where money decisions actually get made.

import { ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useApprovalQueue } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { QueueView } from './approvalQueue/sections/QueueView';

function QueueBody(): ReactElement {
  const queue = useApprovalQueue();

  if (queue.isError) {
    return (
      <ErrorState
        title="Approval queue unavailable"
        message={queue.error.message}
        onRetry={() => {
          void queue.refetch();
        }}
      />
    );
  }
  if (queue.data === undefined) {
    return <LoadingState layout="cards" count={3} />;
  }
  return <QueueView requests={queue.data} />;
}

export function TradingApprovalsPage(): ReactElement {
  return (
    <PageShell
      title="Approval queue"
      description="Orders waiting on your decision, what each would cost, and what it would do to the portfolio."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Signals', to: ROUTES.TRADING_SIGNALS },
        { label: 'Approvals' },
      ]}
    >
      <QueueBody />
    </PageShell>
  );
}
