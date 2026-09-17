import { Badge } from '@staysteady/ui';
import type { BadgeVariant, ColumnDef } from '@staysteady/ui';

import { moneyFromDto } from '../../../../data/api';
import type { OrderHistoryEntryDto, OrderStatusDto } from '../../../../data/schemas';
import { formatMoney, formatRelativeTime, humanizeToken } from '../../../../shared/format';
import { STATUS_LABELS } from '../model/orderFilters';
import styles from '../Orders.module.scss';

const STATUS_VARIANT: Readonly<Record<OrderStatusDto, BadgeVariant>> = {
  pending: 'info',
  partially_filled: 'warning',
  filled: 'positive',
  rejected: 'negative',
  cancelled: 'neutral',
  unconfirmed: 'critical',
};

function money(value: OrderHistoryEntryDto['requestedPrice']): string {
  return value === null ? '—' : formatMoney(moneyFromDto(value));
}

// UI spec 7.13 columns, plus the compliance result for orders still working (E-03).
export function orderColumns(): ColumnDef<OrderHistoryEntryDto, unknown>[] {
  return [
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
        <span className={styles.inline}>
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
          {row.original.coolingOffUntil !== null && <Badge variant="warning">Cooling off</Badge>}
        </span>
      ),
    },
    {
      id: 'compliance',
      header: 'Compliance',
      accessorFn: (entry) => entry.compliance?.status ?? 'ended',
      cell: ({ row }) => {
        const { compliance } = row.original;
        if (compliance === null) return <span className={styles.muted}>Ended</span>;
        return compliance.status === 'passed' ? (
          <Badge variant="positive">Clear</Badge>
        ) : (
          <Badge variant="critical">Restricted</Badge>
        );
      },
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
      cell: ({ row }) => row.original.strategyName ?? <span className={styles.muted}>Manual</span>,
    },
  ];
}
