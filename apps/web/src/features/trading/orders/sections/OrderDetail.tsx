import { Badge } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api';
import type { OrderEventKindDto, OrderHistoryEntryDto } from '../../../../data/schemas';
import { formatDateTime, formatMoney } from '../../../../shared/format';
import styles from '../Orders.module.scss';

const EVENT_VARIANT: Readonly<Record<OrderEventKindDto, BadgeVariant>> = {
  signal_raised: 'neutral',
  approval_requested: 'warning',
  approved: 'positive',
  rejected: 'negative',
  submitted: 'info',
  acknowledged: 'info',
  partially_filled: 'warning',
  filled: 'positive',
  cancelled: 'neutral',
  confirmation_lost: 'critical',
};

// UI spec 7.13 — one order's full lifecycle, from the signal that raised it to how it ended.
export function OrderDetail({ entry }: { readonly entry: OrderHistoryEntryDto }): ReactElement {
  return (
    <div className={styles.detail}>
      <div className={styles.detailGrid}>
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Order</span>
          <span className={styles.detailValue}>{entry.orderId}</span>
        </span>
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Signal</span>
          <span className={styles.detailValue}>{entry.signalId ?? 'None, placed by hand'}</span>
        </span>
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Approval</span>
          <span className={styles.detailValue}>{entry.approvalId ?? 'Not required'}</span>
        </span>
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Filled</span>
          <span className={styles.detailValue}>
            {String(entry.filledQuantity)} of {String(entry.quantity)}
          </span>
        </span>
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Fees</span>
          <span className={styles.detailValue}>
            {entry.fees === null ? 'None charged' : formatMoney(moneyFromDto(entry.fees))}
          </span>
        </span>
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Compliance</span>
          <span className={styles.detailValue}>
            {entry.compliance === null
              ? 'Order has ended; checked at signal stage'
              : `${entry.compliance.summary} ${entry.compliance.policyClause}`}
          </span>
        </span>
        {entry.coolingOffUntil !== null && (
          <span className={styles.detailItem}>
            <span className={styles.detailLabel}>Cooling off until</span>
            <span className={styles.detailValue}>{formatDateTime(entry.coolingOffUntil)}</span>
          </span>
        )}
        <span className={styles.detailItem}>
          <span className={styles.detailLabel}>Execution</span>
          <span className={styles.detailValue}>
            {entry.isSimulated
              ? 'Simulated, never sent to a broker'
              : `Real, via ${entry.brokerName}`}
          </span>
        </span>
      </div>

      <ol className={styles.timeline}>
        {entry.timeline.map((event, index) => (
          <li key={`${event.kind}-${String(index)}`} className={styles.event}>
            <Badge variant={EVENT_VARIANT[event.kind]}>{event.title}</Badge>
            <p className={styles.eventDetail}>{event.detail}</p>
            <p className={styles.eventTime}>{formatDateTime(event.at)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
