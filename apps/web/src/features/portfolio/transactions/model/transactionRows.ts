// Transaction history rows (UI spec 15: fees, charges and currency conversions). Each amount is also
// shown in the base currency at the exchange rate on the day it happened, not today's rate.

import { Decimal } from 'decimal.js';

import { moneyFromDto } from '../../../../data/api';
import type {
  BrokerDto,
  FxRateHistoryDto,
  HoldingDto,
  InstrumentDto,
  TransactionDto,
  TransactionTypeDto,
} from '../../../../data/schemas';
import type { Money } from '../../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../../shared/money';
import type { FxQuote } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';

export const FUNDING_CURRENCY = 'USD';

// Money leaving the account is negative: buys, fees and withdrawals.
const OUTFLOW: ReadonlySet<TransactionTypeDto> = new Set(['buy', 'fee', 'withdrawal']);

export const TYPE_LABELS: Readonly<Record<TransactionTypeDto, string>> = {
  buy: 'Buy',
  sell: 'Sell',
  dividend: 'Dividend',
  split: 'Split',
  fee: 'Fee or charge',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
};

export interface TransactionRow {
  readonly transaction: TransactionDto;
  readonly date: string;
  readonly instrument: InstrumentDto | undefined;
  readonly holding: HoldingDto | undefined;
  readonly brokerName: string | null;
  // Signed in the transaction's own currency, and in the base currency on that day.
  readonly cashEffect: Money;
  readonly cashEffectBase: Money | null;
  readonly fxRate: Decimal | null;
  // For a purchase outside the funding currency: the conversion charge booked with it.
  readonly conversionCharge: TransactionDto | null;
}

// The rate table as it stood on a date: for each pair, the last recorded rate on or before it.
export function tableOn(histories: readonly FxRateHistoryDto[], date: string): FxQuote[] {
  return histories.flatMap((history) => {
    const point = [...history.points].reverse().find((item) => item.date <= date);
    return point === undefined
      ? []
      : [{ from: history.from, to: history.to, rate: new Decimal(point.rate) }];
  });
}

function safeConvert(
  money: Money,
  base: BaseCurrencyCode,
  table: readonly FxQuote[],
): Money | null {
  try {
    return convertMoneyWithTable(money, base, table);
  } catch {
    return null;
  }
}

export function buildTransactionRows(inputs: {
  readonly transactions: readonly TransactionDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly holdings: readonly HoldingDto[];
  readonly brokers: readonly BrokerDto[];
  readonly fxHistories: readonly FxRateHistoryDto[];
  readonly baseCurrency: BaseCurrencyCode;
}): readonly TransactionRow[] {
  const { transactions, instruments, holdings, brokers, fxHistories, baseCurrency } = inputs;
  return [...transactions]
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .map((transaction) => {
      const date = String(transaction.timestamp).slice(0, 10);
      const instrumentId =
        transaction.instrumentId === undefined ? null : String(transaction.instrumentId);
      const instrument = instruments.find((item) => String(item.id) === instrumentId);
      const holding = holdings.find((item) => String(item.instrumentId) === instrumentId);
      const broker = brokers.find((item) => String(item.id) === String(holding?.brokerId));
      const amount = moneyFromDto(transaction.netAmount);
      const signed = OUTFLOW.has(transaction.type)
        ? createMoney(amount.amount.abs().negated(), amount.currency)
        : amount;
      const table = tableOn(fxHistories, date);
      const base = safeConvert(signed, baseCurrency, table);
      const unit = safeConvert(createMoney(1, amount.currency), baseCurrency, table);
      const conversionCharge =
        transaction.type === 'buy' &&
        instrument !== undefined &&
        instrument.currency !== FUNDING_CURRENCY
          ? (transactions.find(
              (other) =>
                other.type === 'fee' &&
                String(other.instrumentId) === instrumentId &&
                String(other.timestamp).slice(0, 10) === date,
            ) ?? null)
          : null;
      return {
        transaction,
        date,
        instrument,
        holding,
        brokerName: broker?.name ?? null,
        cashEffect: signed,
        cashEffectBase: base,
        fxRate: unit === null ? null : unit.amount,
        conversionCharge,
      };
    });
}

export const ALL = 'all';

export interface TransactionFilters {
  readonly type: TransactionTypeDto | typeof ALL;
  readonly instrument: string;
  readonly broker: string;
  readonly currency: string;
  readonly from: string;
  readonly to: string;
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  type: ALL,
  instrument: ALL,
  broker: ALL,
  currency: ALL,
  from: '',
  to: '',
};

export function applyTransactionFilters(
  rows: readonly TransactionRow[],
  filters: TransactionFilters,
): readonly TransactionRow[] {
  return rows.filter(
    (row) =>
      (filters.type === ALL || row.transaction.type === filters.type) &&
      (filters.instrument === ALL || String(row.instrument?.id ?? '') === filters.instrument) &&
      (filters.broker === ALL || row.brokerName === filters.broker) &&
      (filters.currency === ALL || row.cashEffect.currency === filters.currency) &&
      (filters.from === '' || row.date >= filters.from) &&
      (filters.to === '' || row.date <= filters.to),
  );
}

// Totals by type in the base currency. A row whose rate is unknown adds nothing to the total but is
// still counted, and shows "Rate unknown" in the table.
export function totalsByType(
  rows: readonly TransactionRow[],
  base: BaseCurrencyCode,
): { type: TransactionTypeDto; total: Money; count: number }[] {
  const totals = new Map<TransactionTypeDto, { total: Decimal; count: number }>();
  rows.forEach((row) => {
    const current = totals.get(row.transaction.type) ?? { total: new Decimal(0), count: 0 };
    totals.set(row.transaction.type, {
      total: current.total.plus(row.cashEffectBase?.amount ?? 0),
      count: current.count + 1,
    });
  });
  return [...totals.entries()].map(([type, value]) => ({
    type,
    total: createMoney(value.total, base),
    count: value.count,
  }));
}

const csvCell = (text: string): string =>
  /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;

export function transactionsToCsv(rows: readonly TransactionRow[], base: BaseCurrencyCode): string {
  const header = [
    'Date',
    'Type',
    'Instrument',
    'Broker',
    'Quantity',
    'Unit price',
    'Fees',
    'Cash effect',
    `Cash effect (${base})`,
    'Rate',
    'Notes',
  ];
  const lines = rows.map((row) => {
    const tx = row.transaction;
    return [
      row.date,
      TYPE_LABELS[tx.type],
      row.instrument?.symbol ?? '',
      row.brokerName ?? '',
      tx.quantity === undefined ? '' : String(tx.quantity),
      tx.unitPrice === undefined ? '' : `${tx.unitPrice.amount} ${tx.unitPrice.currency}`,
      `${tx.fees.amount} ${tx.fees.currency}`,
      `${row.cashEffect.amount.toFixed()} ${row.cashEffect.currency}`,
      row.cashEffectBase === null ? '' : row.cashEffectBase.amount.toFixed(2),
      row.fxRate === null ? '' : row.fxRate.toFixed(6),
      tx.notes ?? '',
    ].map(csvCell);
  });
  return `${[header.map(csvCell), ...lines].map((line) => line.join(',')).join('\n')}\n`;
}
