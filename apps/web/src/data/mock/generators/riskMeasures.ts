// Measurements behind the risk limits (UI spec 7.14): losses over a period from price history, and
// how holdings are spread across instruments, markets, countries and types.

import { Decimal } from 'decimal.js';

import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import type { CurrencyCode } from '../../../shared/types/currency';
import type { HoldingDto } from '../../schemas';
import { generateInitialQuotes, getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';

export const BASE: CurrencyCode = 'USD';
const WEEK_BARS = 5;
const MONTH_BARS = 21;

export const pct = (value: number): string => `${value.toFixed(2)}%`;

export function toBase(amount: Decimal, currency: CurrencyCode, fx: readonly FxQuote[]): Decimal {
  return currency === BASE
    ? amount
    : convertMoneyWithTable(createMoney(amount, currency), BASE, fx).amount;
}

// Loss is measured against total capital at the start of the period, invested plus cash, and is
// zero when the period was a gain.
export function losses(
  ctx: MockGeneratorContext,
  holdings: readonly HoldingDto[],
  cash: Decimal,
  fx: readonly FxQuote[],
): { daily: number; weekly: number; monthly: number } {
  const quotes = generateInitialQuotes(ctx);
  const lossOver = (change: Decimal, now: Decimal): number => {
    const start = now.minus(change).plus(cash);
    return change.isNegative() && !start.isZero()
      ? Number(change.negated().dividedBy(start).times(100).toFixed(2))
      : 0;
  };

  let dailyChange = new Decimal(0);
  let invested = new Decimal(0);
  let weeklyChange = new Decimal(0);
  let monthlyChange = new Decimal(0);
  for (const holding of holdings) {
    const currency = holding.currentValue.currency;
    const quantity = new Decimal(Number(holding.quantity));
    invested = invested.plus(toBase(new Decimal(holding.currentValue.amount), currency, fx));
    const quote = quotes.find((item) => String(item.instrumentId) === String(holding.instrumentId));
    if (quote !== undefined) {
      const move = new Decimal(quote.lastPrice.amount).minus(quote.previousClose.amount);
      dailyChange = dailyChange.plus(toBase(move.times(quantity), currency, fx));
    }
    const instrument = getInstrumentById(String(holding.instrumentId));
    if (instrument === undefined) continue;
    const bars = generatePriceHistoryForInstrument(ctx, instrument);
    const last = bars[bars.length - 1];
    const weekAgo = bars[bars.length - 1 - WEEK_BARS];
    const monthAgo = bars[bars.length - 1 - MONTH_BARS];
    if (last === undefined) continue;
    if (weekAgo !== undefined) {
      const move = new Decimal(last.close).minus(weekAgo.close).times(quantity);
      weeklyChange = weeklyChange.plus(toBase(move, currency, fx));
    }
    if (monthAgo !== undefined) {
      const move = new Decimal(last.close).minus(monthAgo.close).times(quantity);
      monthlyChange = monthlyChange.plus(toBase(move, currency, fx));
    }
  }
  return {
    daily: lossOver(dailyChange, invested),
    weekly: lossOver(weeklyChange, invested),
    monthly: lossOver(monthlyChange, invested),
  };
}

// Largest share held by any one key, with the key that holds it.
export function largest(shares: ReadonlyMap<string, number>): { key: string; share: number } {
  let best = { key: 'nothing', share: 0 };
  shares.forEach((share, key) => {
    if (share > best.share) best = { key, share };
  });
  return best;
}

export function sumBy(
  holdings: readonly HoldingDto[],
  keyOf: (holding: HoldingDto) => string,
): Map<string, number> {
  const shares = new Map<string, number>();
  holdings.forEach((holding) => {
    const key = keyOf(holding);
    shares.set(
      key,
      Number(((shares.get(key) ?? 0) + Number(holding.allocationPercent)).toFixed(2)),
    );
  });
  return shares;
}
