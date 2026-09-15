// Currency conversion through a table of FX rates (requirements 10, standards 6.4).
// Pairs may be quoted in either direction; a pair with no rate is crossed through USD.

import { Decimal } from 'decimal.js';

import type { CurrencyCode } from '../types/currency';
import type { Money } from './money';
import { createMoney } from './money';

export interface FxQuote {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  // Units of `to` for one unit of `from`.
  readonly rate: Decimal;
}

const CROSS_CURRENCY: CurrencyCode = 'USD';

function directOrInverseRate(
  table: readonly FxQuote[],
  from: CurrencyCode,
  to: CurrencyCode,
): Decimal | undefined {
  if (from === to) {
    return new Decimal(1);
  }
  const direct = table.find((quote) => quote.from === from && quote.to === to);
  if (direct !== undefined) {
    return direct.rate;
  }
  const inverse = table.find((quote) => quote.from === to && quote.to === from);
  return inverse === undefined || inverse.rate.isZero()
    ? undefined
    : new Decimal(1).dividedBy(inverse.rate);
}

export function findFxRate(
  table: readonly FxQuote[],
  from: CurrencyCode,
  to: CurrencyCode,
): Decimal | undefined {
  const rate = directOrInverseRate(table, from, to);
  if (rate !== undefined) {
    return rate;
  }
  const toCross = directOrInverseRate(table, from, CROSS_CURRENCY);
  const fromCross = directOrInverseRate(table, CROSS_CURRENCY, to);
  return toCross === undefined || fromCross === undefined ? undefined : toCross.times(fromCross);
}

// Throws when no rate path exists, so a missing rate is never silently treated as 1.
export function convertMoneyWithTable<To extends CurrencyCode>(
  money: Money,
  to: To,
  table: readonly FxQuote[],
): Money<To> {
  const rate = findFxRate(table, money.currency, to);
  if (rate === undefined) {
    throw new RangeError(`No FX rate path from ${money.currency} to ${to}`);
  }
  return createMoney(money.amount.times(rate), to);
}
