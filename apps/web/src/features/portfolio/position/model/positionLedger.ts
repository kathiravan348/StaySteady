// Transactions, costs and income for one position (UI spec 7.3). Pure: no React, no fetching.
// Costs and income convert at the exchange rate on their own date, like purchase costs in Holdings.

import { Decimal } from 'decimal.js';

import { fxTableFromDtos, moneyFromDto } from '../../../../data/api/mappers';
import type { FxRateDto, FxRateHistoryDto, TransactionDto } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';
import type { FxQuote, Money } from '../../../../shared/money';
import { createMoney, findFxRate } from '../../../../shared/money';
import type { BaseCurrencyCode, CurrencyCode } from '../../../../shared/types/currency';
import type { FxHistoryIndex } from '../../holdings/model/fxOnDate';
import { fxTableOn, indexFxHistories } from '../../holdings/model/fxOnDate';
import type { ManualTransaction } from './positionEdits';
import { isTradeType } from './positionEdits';
import type { CashFlowItem, CashFlowSummary, LedgerEntry } from './positionTypes';

export interface FxSources {
  readonly current: readonly FxQuote[];
  readonly history: FxHistoryIndex;
}

export function fxSourcesFrom(
  rates: readonly FxRateDto[],
  histories: readonly FxRateHistoryDto[],
): FxSources {
  return { current: fxTableFromDtos(rates), history: indexFxHistories(histories) };
}

export function ledgerFromDtos(
  transactions: readonly TransactionDto[],
  instrumentId: string,
): LedgerEntry[] {
  return transactions
    .filter((transaction) => transaction.instrumentId === instrumentId)
    .map((transaction) => ({
      id: transaction.id,
      date: transaction.timestamp.slice(0, 10),
      type: transaction.type,
      quantity: transaction.quantity ?? null,
      unitPrice: transaction.unitPrice === undefined ? null : moneyFromDto(transaction.unitPrice),
      fees: moneyFromDto(transaction.fees),
      netAmount: moneyFromDto(transaction.netAmount),
      notes: transaction.notes ?? '',
      isManual: false,
    }));
}

// Buys cost price x quantity plus fees; sells return price x quantity less fees; dividends and
// charges are a single amount.
export function ledgerFromManual(
  entries: readonly ManualTransaction[],
  currency: CurrencyCode,
): LedgerEntry[] {
  return entries.map((entry) => {
    const trade = isTradeType(entry.type);
    const fees = createMoney(entry.fees, currency);
    const quantity = new Decimal(entry.quantity);
    const price = new Decimal(entry.unitPrice);
    const gross = trade ? quantity.times(price) : price;
    const net =
      entry.type === 'buy'
        ? gross.plus(fees.amount)
        : entry.type === 'sell'
          ? gross.minus(fees.amount)
          : gross;
    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      quantity: trade ? quantity.toNumber() : null,
      unitPrice: trade ? createMoney(price, currency) : null,
      fees,
      netAmount: createMoney(net, currency),
      notes: entry.notes,
      isManual: true,
    };
  });
}

export function sortNewestFirst(entries: readonly LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

interface CashFlowDraft {
  readonly entry: LedgerEntry;
  readonly label: string;
  readonly amount: Money;
}

function toBaseOn(
  amount: Money,
  date: string,
  baseCurrency: BaseCurrencyCode,
  fx: FxSources,
): Money<BaseCurrencyCode> {
  const rate =
    findFxRate(fxTableOn(fx.history, date), amount.currency, baseCurrency) ??
    findFxRate(fx.current, amount.currency, baseCurrency);
  if (rate === undefined) {
    throw new RangeError(`No FX rate path from ${amount.currency} to ${baseCurrency}`);
  }
  return createMoney(amount.amount.times(rate).toDecimalPlaces(2), baseCurrency);
}

function summarise(
  drafts: readonly CashFlowDraft[],
  baseCurrency: BaseCurrencyCode,
  fx: FxSources,
): CashFlowSummary {
  const items: CashFlowItem[] = drafts.map(({ entry, label, amount }) => ({
    id: entry.id,
    date: entry.date,
    label,
    amount,
    amountBase: toBaseOn(amount, entry.date, baseCurrency, fx),
    isManual: entry.isManual,
  }));
  const total = items.reduce((sum, item) => sum.plus(item.amountBase.amount), new Decimal(0));
  return { items: sortByDateDesc(items), totalBase: createMoney(total, baseCurrency) };
}

function sortByDateDesc(items: readonly CashFlowItem[]): CashFlowItem[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

// Trading fees on every transaction plus standalone charges such as currency conversion.
export function summariseCosts(
  entries: readonly LedgerEntry[],
  baseCurrency: BaseCurrencyCode,
  fx: FxSources,
): CashFlowSummary {
  const drafts = entries.flatMap((entry): CashFlowDraft[] => {
    if (entry.type === 'fee') {
      return [
        { entry, label: entry.notes === '' ? 'Charge' : entry.notes, amount: entry.netAmount },
      ];
    }
    return entry.fees.amount.isZero()
      ? []
      : [{ entry, label: `${humanizeToken(entry.type)} fee`, amount: entry.fees }];
  });
  return summarise(drafts, baseCurrency, fx);
}

export function summariseIncome(
  entries: readonly LedgerEntry[],
  baseCurrency: BaseCurrencyCode,
  fx: FxSources,
): CashFlowSummary {
  const drafts = entries
    .filter((entry) => entry.type === 'dividend')
    .map((entry) => ({
      entry,
      label: entry.notes === '' ? 'Dividend' : entry.notes,
      amount: entry.netAmount,
    }));
  return summarise(drafts, baseCurrency, fx);
}
