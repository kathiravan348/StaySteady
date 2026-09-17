import { Button, DataTable, NoResultsState, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type { OrderHistoryEntryDto } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';
import type { OrderFilters } from '../model/orderFilters';
import {
  DEFAULT_ORDER_FILTERS,
  applyOrderFilters,
  isOrderFiltered,
  orderCounts,
  orderFilterOptions,
} from '../model/orderFilters';
import { OrderDetail } from './OrderDetail';
import { OrderFilterBar } from './OrderFilterBar';
import { orderColumns } from './orderColumns';
import styles from '../Orders.module.scss';

const getRowId = (entry: OrderHistoryEntryDto): string => entry.orderId;

const rowClass = (entry: OrderHistoryEntryDto): string | undefined =>
  entry.status === 'unconfirmed' || entry.compliance?.status === 'refused'
    ? styles.unconfirmedRow
    : entry.isSimulated
      ? styles.simulatedRow
      : undefined;

const describe = (entry: OrderHistoryEntryDto): string =>
  `${humanizeToken(entry.side)} ${String(entry.quantity)} ${entry.instrumentSymbol} at ${entry.brokerName}`;

export function OrdersView({
  entries,
}: {
  readonly entries: readonly OrderHistoryEntryDto[];
}): ReactElement {
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_ORDER_FILTERS);
  const visible = applyOrderFilters(entries, filters);
  const options = orderFilterOptions(entries);
  const counts = orderCounts(entries);
  const unconfirmed = entries.filter((entry) => entry.status === 'unconfirmed');
  const restricted = entries.filter((entry) => entry.compliance?.status === 'refused');
  const columns = useMemo(() => orderColumns(), []);

  return (
    <div className={styles.page}>
      {restricted.length > 0 && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertTitle}>
            {restricted.length === 1
              ? '1 working order is now restricted'
              : `${String(restricted.length)} working orders are now restricted`}
          </span>
          <p className={styles.note}>
            {restricted
              .map((entry) => `${describe(entry)}: ${entry.compliance?.summary ?? ''}`)
              .join('; ')}
            . Cancel {restricted.length === 1 ? 'it' : 'them'} with the broker; the safety layer
            would refuse the same trade today.
          </p>
        </div>
      )}

      {unconfirmed.length > 0 && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertTitle}>
            {unconfirmed.length === 1
              ? '1 order was never confirmed by its broker'
              : `${String(unconfirmed.length)} orders were never confirmed by their brokers`}
          </span>
          <p className={styles.note}>
            Nobody knows whether {unconfirmed.map(describe).join(', ')} is live. Check with the
            broker before placing anything else in that instrument, or a duplicate position could
            open.
          </p>
        </div>
      )}

      <div className={styles.summary}>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Orders</span>
          <span className={styles.summaryValue}>{counts.total}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Still working</span>
          <span className={styles.summaryValue}>{counts.working}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Unconfirmed</span>
          <span
            className={cx(
              styles.summaryValue,
              counts.unconfirmed > 0 ? styles.negative : undefined,
            )}
          >
            {counts.unconfirmed}
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Simulated</span>
          <span className={styles.summaryValue}>{counts.simulated}</span>
        </span>
      </div>

      <OrderFilterBar
        filters={filters}
        options={options}
        shown={visible.length}
        total={entries.length}
        onChange={setFilters}
      />

      {visible.length === 0 ? (
        <NoResultsState
          title="No orders match these filters"
          description="Clear the filters to see the full order history."
          action={
            isOrderFiltered(filters) ? (
              <Button
                variant="secondary"
                onPress={() => {
                  setFilters(DEFAULT_ORDER_FILTERS);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          data={visible}
          columns={columns}
          getRowId={getRowId}
          ariaLabel="Order history"
          pageSize={20}
          getRowClassName={rowClass}
          renderRowDetails={(entry) => <OrderDetail entry={entry} />}
        />
      )}
    </div>
  );
}
