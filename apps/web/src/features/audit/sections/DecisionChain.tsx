import { Card, ErrorState, LoadingState, cx } from '@staysteady/ui';
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
      <ol className={styles.chain} aria-label={`Decision chain for order ${orderId}`}>
        {order.timeline.map((event, index) => (
          <li key={`${event.kind}-${event.at}`} className={styles.step}>
            <span
              className={cx(
                styles.stepNumber,
                event.at === highlightAt ? styles.current : undefined,
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className={styles.stack}>
              <strong className={styles.note}>
                {event.title}
                {event.at === highlightAt ? ' (this entry)' : ''}
              </strong>
              <span className={styles.meta}>
                {formatDateTime(event.at)} · {event.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.meta}>
        Signal {order.signalId ?? 'none (manual)'} · approval {order.approvalId ?? 'none'} · order{' '}
        {order.orderId}
      </p>
    </Card>
  );
}
