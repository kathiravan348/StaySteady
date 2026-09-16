import { Badge, Button, DataTable, NoResultsState } from '@staysteady/ui';
import type { ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api';
import { TransactionTypeSchema } from '../../../../data/schemas';
import { formatMoney } from '../../../../shared/format';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import { positionDetailPath } from '../../../../routes/routes';
import type { TransactionFilters, TransactionRow } from '../model/transactionRows';
import {
  ALL,
  DEFAULT_TRANSACTION_FILTERS,
  FUNDING_CURRENCY,
  TYPE_LABELS,
  applyTransactionFilters,
  totalsByType,
  transactionsToCsv,
} from '../model/transactionRows';
import styles from '../Transactions.module.scss';

function download(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const signedClass = (row: TransactionRow): string | undefined =>
  row.cashEffect.amount.isNegative()
    ? styles.outflow
    : row.cashEffect.amount.isPositive()
      ? styles.inflow
      : undefined;

function Detail({ row }: { readonly row: TransactionRow }): ReactElement {
  const tx = row.transaction;
  return (
    <div className={styles.stack}>
      {tx.notes !== undefined && <p className={styles.note}>{tx.notes}</p>}
      <p className={styles.meta}>
        Fees {formatMoney(moneyFromDto(tx.fees))}
        {tx.unitPrice === undefined
          ? ''
          : ` · ${String(tx.quantity ?? '')} at ${formatMoney(moneyFromDto(tx.unitPrice))}`}
        {row.fxRate === null || row.cashEffect.currency === row.cashEffectBase?.currency
          ? ''
          : ` · 1 ${row.cashEffect.currency} = ${row.fxRate.toFixed(4)} ${row.cashEffectBase?.currency ?? ''} on ${row.date}`}
      </p>
      {row.conversionCharge !== null && (
        <p className={styles.note}>
          Bought in {row.cashEffect.currency}: money was converted from {FUNDING_CURRENCY}, with a
          conversion charge of {formatMoney(moneyFromDto(row.conversionCharge.netAmount))} booked
          the same day.
        </p>
      )}
      {row.holding !== undefined && (
        <Link className={styles.meta} to={positionDetailPath(row.holding.id)}>
          Open the {row.instrument?.symbol ?? ''} position
        </Link>
      )}
    </div>
  );
}

// UI spec 15 — transaction history with fees, charges and currency conversions.
export function TransactionsView({
  rows,
  baseCurrency,
}: {
  readonly rows: readonly TransactionRow[];
  readonly baseCurrency: BaseCurrencyCode;
}): ReactElement {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const visible = applyTransactionFilters(rows, filters);
  const totals = totalsByType(visible, baseCurrency);
  const set = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]): void => {
    setFilters({ ...filters, [key]: value });
  };
  const instruments = [
    ...new Map(
      rows.flatMap((row) =>
        row.instrument === undefined
          ? []
          : [[String(row.instrument.id), row.instrument.symbol] as const],
      ),
    ).entries(),
  ];
  const brokers = [
    ...new Set(rows.flatMap((row) => (row.brokerName === null ? [] : [row.brokerName]))),
  ];
  const currencies = [...new Set(rows.map((row) => row.cashEffect.currency))];

  const columns = useMemo<ColumnDef<TransactionRow, unknown>[]>(
    () => [
      { id: 'date', header: 'Date', accessorFn: (row) => row.date },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => row.transaction.type,
        cell: ({ row }) => (
          <Badge variant="neutral">{TYPE_LABELS[row.original.transaction.type]}</Badge>
        ),
      },
      {
        id: 'instrument',
        header: 'Instrument',
        accessorFn: (row) => row.instrument?.symbol ?? '—',
      },
      { id: 'broker', header: 'Broker', accessorFn: (row) => row.brokerName ?? '—' },
      {
        id: 'quantity',
        header: 'Quantity',
        accessorFn: (row) => row.transaction.quantity ?? null,
        cell: ({ row }) =>
          row.original.transaction.quantity === undefined
            ? '—'
            : String(row.original.transaction.quantity),
        meta: { align: 'end', label: 'Quantity' },
      },
      {
        id: 'fees',
        header: 'Fees',
        accessorFn: (row) => Number(row.transaction.fees.amount),
        cell: ({ row }) => formatMoney(moneyFromDto(row.original.transaction.fees)),
        meta: { align: 'end', label: 'Fees' },
      },
      {
        id: 'cash',
        header: 'Cash effect',
        accessorFn: (row) => row.cashEffect.amount.toNumber(),
        cell: ({ row }) => (
          <span className={signedClass(row.original)}>
            {formatMoney(row.original.cashEffect, { signed: true })}
          </span>
        ),
        meta: { align: 'end', label: 'Cash effect' },
      },
      {
        id: 'base',
        header: `In ${baseCurrency} on the day`,
        accessorFn: (row) => row.cashEffectBase?.amount.toNumber() ?? null,
        cell: ({ row }) =>
          row.original.cashEffectBase === null
            ? 'Rate unknown'
            : formatMoney(row.original.cashEffectBase, { signed: true }),
        meta: { align: 'end', label: `In ${baseCurrency}` },
      },
    ],
    [baseCurrency],
  );

  return (
    <div className={styles.page}>
      <div
        className={styles.totals}
        aria-label={`Totals in ${baseCurrency} for the transactions shown`}
      >
        {totals.map((item) => (
          <div key={item.type} className={styles.total}>
            <span className={styles.fieldLabel}>
              {TYPE_LABELS[item.type]} ({item.count})
            </span>
            <span className={styles.totalValue}>{formatMoney(item.total, { signed: true })}</span>
          </div>
        ))}
      </div>

      <div className={styles.filters} role="search" aria-label="Filter transactions">
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Type</span>
          <select
            className={styles.input}
            value={filters.type}
            onChange={(event) => {
              set(
                'type',
                TransactionTypeSchema.options.find((item) => item === event.target.value) ?? ALL,
              );
            }}
          >
            <option value={ALL}>All types</option>
            {TransactionTypeSchema.options.map((item) => (
              <option key={item} value={item}>
                {TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Instrument</span>
          <select
            className={styles.input}
            value={filters.instrument}
            onChange={(event) => {
              set('instrument', event.target.value);
            }}
          >
            <option value={ALL}>All instruments</option>
            {instruments.map(([id, symbol]) => (
              <option key={id} value={id}>
                {symbol}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Broker</span>
          <select
            className={styles.input}
            value={filters.broker}
            onChange={(event) => {
              set('broker', event.target.value);
            }}
          >
            <option value={ALL}>All brokers</option>
            {brokers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Currency</span>
          <select
            className={styles.input}
            value={filters.currency}
            onChange={(event) => {
              set('currency', event.target.value);
            }}
          >
            <option value={ALL}>All currencies</option>
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>From</span>
          <input
            className={styles.input}
            type="date"
            value={filters.from}
            onChange={(event) => {
              set('from', event.target.value);
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>To</span>
          <input
            className={styles.input}
            type="date"
            value={filters.to}
            onChange={(event) => {
              set('to', event.target.value);
            }}
          />
        </label>
      </div>

      <div className={styles.inline}>
        <span className={styles.meta}>
          {visible.length} of {rows.length} transactions, newest first. Amounts in {baseCurrency}{' '}
          use the exchange rate on each transaction&apos;s date.
        </span>
        <Button
          variant="secondary"
          isDisabled={visible.length === 0}
          onPress={() => {
            download(
              `staysteady-transactions-${baseCurrency}.csv`,
              transactionsToCsv(visible, baseCurrency),
            );
          }}
        >
          Export CSV
        </Button>
      </div>

      {visible.length === 0 ? (
        <NoResultsState
          title="No transactions match"
          description="Widen the filters to see more."
          onClearFilters={() => {
            setFilters(DEFAULT_TRANSACTION_FILTERS);
          }}
        />
      ) : (
        <DataTable
          data={[...visible]}
          columns={columns}
          getRowId={(row) => row.transaction.id}
          pageSize={20}
          renderRowDetails={(row) => <Detail row={row} />}
        />
      )}
    </div>
  );
}
