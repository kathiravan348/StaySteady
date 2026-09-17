import { Card, ErrorState, LoadingState, Timeline } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useOrderHistory } from '../../../data/api';
import { formatDateTime, humanizeToken } from '../../../shared/format';
import styles from '../Audit.module.scss';

// UI spec 7.20 — one decision chain end to end: the order's lifecycle from the signal that raised it,
// through approval, to submission and fill, in order, with the step the audit entry came from marked.
export function DecisionChain({
  orderId,
  highlightAt,
}: {
  readonly orderId: string;
  readonly highlightAt: string | null;
}): ReactElement {
  const history = useOrderHistory();

  if (history.isError) {
    return (
      <ErrorState
        title="Decision chain unavailable"
        message={history.error.message}
        onRetry={() => {
          void history.refetch();
        }}
      />
    );
  }
  if (history.data === undefined) return <LoadingState layout="detail" count={1} />;
  const order = history.data.find((item) => item.orderId === orderId);
  if (order === undefined) {
    return <p className={styles.note}>Order {orderId} is no longer in the order history.</p>;
  }

  return (
    <Card
      title={`Decision chain: ${order.side} ${String(order.quantity)} ${order.instrumentSymbol}`}
      extra={
        <span className={styles.meta}>
          {order.strategyName ?? 'Placed by hand'} · {order.brokerName} · now{' '}
          {humanizeToken(order.status)}
        </span>
      }
    >
      <Timeline
        items={order.timeline.map((event, index) => ({
          id: `${event.kind}-${event.at}`,
          stepNumber: index + 1,
          isCurrent: event.at === highlightAt,
          status: event.at === highlightAt ? 'info' : 'neutral',
          title: (
            <span>
              {event.title}
              {event.at === highlightAt && ' (this entry)'}
            </span>
          ),
          timestamp: formatDateTime(event.at),
          detail: event.detail,
        }))}
      />
      <p className={styles.meta}>
        Signal {order.signalId ?? 'none (manual)'} · approval {order.approvalId ?? 'none'} · order{' '}
        {order.orderId}
      </p>
    </Card>
  );
}
