import { Badge, DataTable, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { formatIsoDate, formatMoney, formatNumber, humanizeToken } from '../../../../shared/format';
import { toIsoDate } from '../../../../shared/types/dateTime';
import type { LedgerEntry, LedgerState } from '../model/positionTypes';
import styles from '../PositionPage.module.scss';

export interface TransactionsPanelProps {
  readonly ledger: LedgerState;
  readonly symbol: string;
  readonly onRemoveManual: (id: string) => void;
}

type LedgerColumn = ColumnDef<LedgerEntry, unknown>;

const getRowId = (entry: LedgerEntry): string => entry.id;

function createColumns(onRemoveManual: (id: string) => void): LedgerColumn[] {
  return [
    {
      id: 'date',
      header: 'Date',
      accessorFn: (entry) => entry.date,
      cell: ({ row }) => formatIsoDate(toIsoDate(row.original.date)),
    },
    {
      id: 'type',
      header: 'Type',
      accessorFn: (entry) => entry.type,
      cell: ({ row }) => (
        <span className={styles.inline}>
          {humanizeToken(row.original.type)}
          {row.original.isManual && <Badge variant="info">Manual, this session only</Badge>}
        </span>
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessorFn: (entry) => entry.quantity ?? 0,
      meta: { align: 'end', label: 'Quantity' },
      cell: ({ row }) =>
        row.original.quantity === null
          ? '—'
          : formatNumber(row.original.quantity, {
              decimals: Number.isInteger(row.original.quantity) ? 0 : 4,
            }),
    },
    {
      id: 'unitPrice',
      header: 'Price',
      accessorFn: (entry) => entry.unitPrice?.amount.toNumber() ?? 0,
      meta: { align: 'end', label: 'Price per unit' },
      cell: ({ row }) =>
        row.original.unitPrice === null
          ? '—'
          : formatMoney(row.original.unitPrice, { showCurrency: 'code' }),
    },
    {
      id: 'fees',
      header: 'Fees',
      accessorFn: (entry) => entry.fees.amount.toNumber(),
      meta: { align: 'end', label: 'Fees' },
      cell: ({ row }) => formatMoney(row.original.fees, { showCurrency: 'code' }),
    },
    {
      id: 'net',
      header: 'Net amount',
      accessorFn: (entry) => entry.netAmount.amount.toNumber(),
      meta: { align: 'end', label: 'Net amount' },
      cell: ({ row }) => formatMoney(row.original.netAmount, { showCurrency: 'code' }),
    },
    { id: 'notes', header: 'Notes', accessorFn: (entry) => entry.notes, enableSorting: false },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isManual ? (
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              onRemoveManual(row.original.id);
            }}
          >
            Remove
          </button>
        ) : null,
    },
  ];
}

// UI spec 7.3 — transaction history for this instrument, newest first.
export function TransactionsPanel({
  ledger,
  symbol,
  onRemoveManual,
}: TransactionsPanelProps): ReactElement {
  const columns = useMemo(() => createColumns(onRemoveManual), [onRemoveManual]);

  if (ledger.status === 'error') {
    return (
      <ErrorState
        title="Transactions unavailable"
        message={ledger.message}
        onRetry={ledger.retry}
      />
    );
  }
  if (ledger.status === 'loading') {
    return <LoadingState layout="table" count={5} />;
  }
  if (ledger.entries.length === 0) {
    return (
      <EmptyState
        title="No transactions recorded"
        description={`No transactions for ${symbol} yet. Use "Add transaction" to record one.`}
      />
    );
  }
  return (
    <DataTable
      data={ledger.entries}
      columns={columns}
      getRowId={getRowId}
      ariaLabel={`Transactions for ${symbol}`}
      enablePagination={false}
    />
  );
}
