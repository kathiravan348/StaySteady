import { Badge, Button, DataTable, NoResultsState, cx } from '@staysteady/ui';
import type { BadgeVariant, ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { moneyFromDto } from '../../../../data/api';
import type { OrderHistoryEntryDto, OrderStatusDto } from '../../../../data/schemas';
import { formatMoney, formatRelativeTime, humanizeToken } from '../../../../shared/format';
import type { OrderFilters } from '../model/orderFilters';
import {
  ALL,
  DEFAULT_ORDER_FILTERS,
  STATUS_LABELS,
  applyOrderFilters,
  isOrderFiltered,
  orderCounts,
  orderFilterOptions,
} from '../model/orderFilters';
import { OrderDetail } from './OrderDetail';
import styles from '../Orders.module.scss';

const STATUS_VARIANT: Readonly<Record<OrderStatusDto, BadgeVariant>> = {
  pending: 'info',
  partially_filled: 'warning',
  filled: 'positive',
  rejected: 'negative',
  cancelled: 'neutral',
  unconfirmed: 'critical',
};

const getRowId = (entry: OrderHistoryEntryDto): string => entry.orderId;

const rowClass = (entry: OrderHistoryEntryDto): string | undefined =>
  entry.status === 'unconfirmed'
    ? styles.unconfirmedRow
    : entry.isSimulated
      ? styles.simulatedRow
      : undefined;

function money(value: OrderHistoryEntryDto['requestedPrice']): string {
  return value === null ? '—' : formatMoney(moneyFromDto(value));
}

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

  const columns = useMemo<ColumnDef<OrderHistoryEntryDto, unknown>[]>(
    () => [
      {
        id: 'instrument',
        header: 'Instrument',
        accessorFn: (entry) => entry.instrumentSymbol,
        cell: ({ row }) => (
          <span className={styles.inline}>
            <strong>{row.original.instrumentSymbol}</strong>
            {row.original.isSimulated && <Badge variant="neutral">Simulated</Badge>}
          </span>
        ),
      },
      { id: 'market', header: 'Market', accessorFn: (entry) => entry.marketId },
      { id: 'broker', header: 'Broker', accessorFn: (entry) => entry.brokerName },
      {
        id: 'side',
        header: 'Direction',
        accessorFn: (entry) => entry.side,
        cell: ({ row }) => (
          <span className={row.original.side === 'buy' ? styles.positive : styles.negative}>
            {humanizeToken(row.original.side)}
          </span>
        ),
      },
      {
        id: 'quantity',
        header: 'Quantity',
        accessorFn: (entry) => Number(entry.quantity),
        meta: { align: 'end', label: 'Quantity' },
      },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (entry) => entry.orderType,
        cell: ({ row }) => humanizeToken(row.original.orderType),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (entry) => entry.status,
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'requested',
        header: 'Requested',
        accessorFn: (entry) => Number(entry.requestedPrice?.amount ?? 0),
        meta: { align: 'end', label: 'Requested price' },
        cell: ({ row }) =>
          row.original.requestedPrice === null ? (
            <span className={styles.muted}>Market</span>
          ) : (
            money(row.original.requestedPrice)
          ),
      },
      {
        id: 'filled',
        header: 'Filled at',
        accessorFn: (entry) => Number(entry.averageFilledPrice?.amount ?? 0),
        meta: { align: 'end', label: 'Filled price' },
        cell: ({ row }) => money(row.original.averageFilledPrice),
      },
      {
        id: 'slippage',
        header: 'Slippage',
        accessorFn: (entry) => entry.slippageBps ?? 0,
        meta: { align: 'end', label: 'Slippage' },
        cell: ({ row }) => {
          const bps = row.original.slippageBps;
          if (bps === null) return '—';
          // Positive slippage means a worse fill than requested.
          return (
            <span className={bps > 0 ? styles.negative : styles.positive}>
              {bps > 0 ? '+' : ''}
              {bps.toFixed(1)} bps
            </span>
          );
        },
      },
      {
        id: 'fees',
        header: 'Fees',
        accessorFn: (entry) => Number(entry.fees?.amount ?? 0),
        meta: { align: 'end', label: 'Fees' },
        cell: ({ row }) => money(row.original.fees),
      },
      {
        id: 'updated',
        header: 'Updated',
        accessorFn: (entry) => String(entry.updatedAt),
        cell: ({ row }) => formatRelativeTime(row.original.updatedAt),
      },
      {
        id: 'origin',
        header: 'Origin',
        accessorFn: (entry) => entry.strategyName ?? 'Manual',
        cell: ({ row }) =>
          row.original.strategyName ?? <span className={styles.muted}>Manual</span>,
      },
    ],
    [],
  );

  return (
    <div className={styles.page}>
      {unconfirmed.length > 0 && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertTitle}>
            {unconfirmed.length === 1
              ? '1 order was never confirmed by its broker'
              : `${String(unconfirmed.length)} orders were never confirmed by their brokers`}
          </span>
          <p className={styles.note}>
            Nobody knows whether{' '}
            {unconfirmed
              .map(
                (entry) =>
                  `${humanizeToken(entry.side)} ${String(entry.quantity)} ${entry.instrumentSymbol} at ${entry.brokerName}`,
              )
              .join(', ')}{' '}
            is live. Check with the broker before placing anything else in that instrument, or a
            duplicate position could open.
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

      <div className={styles.filterBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Broker</span>
          <select
            className={styles.input}
            value={filters.broker}
            onChange={(event) => {
              setFilters({ ...filters, broker: event.target.value });
            }}
          >
            <option value={ALL}>Any broker</option>
            {options.brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Market</span>
          <select
            className={styles.input}
            value={filters.market}
            onChange={(event) => {
              setFilters({ ...filters, market: event.target.value });
            }}
          >
            <option value={ALL}>Any market</option>
            {options.markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Status</span>
          <select
            className={styles.input}
            value={filters.status}
            onChange={(event) => {
              setFilters({ ...filters, status: event.target.value as OrderFilters['status'] });
            }}
          >
            <option value={ALL}>Any status</option>
            {options.statuses.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Strategy</span>
          <select
            className={styles.input}
            value={filters.strategy}
            onChange={(event) => {
              setFilters({ ...filters, strategy: event.target.value });
            }}
          >
            <option value={ALL}>Any origin</option>
            {options.strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>From</span>
          <input
            type="date"
            className={styles.input}
            value={filters.from}
            onChange={(event) => {
              setFilters({ ...filters, from: event.target.value });
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>To</span>
          <input
            type="date"
            className={styles.input}
            value={filters.to}
            onChange={(event) => {
              setFilters({ ...filters, to: event.target.value });
            }}
          />
        </label>
        <span className={styles.meta}>
          Showing {visible.length} of {entries.length}
        </span>
      </div>

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
