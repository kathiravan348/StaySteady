// Arbitrary-precision money arithmetic utilities (standards 6.4, decisions 4 and 7).
// Adding or subtracting mismatched currencies is prevented at compile time.

import { Decimal } from 'decimal.js';
import type { CurrencyCode } from '../types/currency';
import type { Ratio } from '../types/quantities';
import type { Money } from './money';
import { createMoney, zeroMoney } from './money';

export function addMoney<C extends CurrencyCode>(a: Money<C>, b: Money<C>): Money<C> {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot add amounts with different currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return {
    amount: a.amount.plus(b.amount),
    currency: a.currency,
  };
}

export function subtractMoney<C extends CurrencyCode>(a: Money<C>, b: Money<C>): Money<C> {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot subtract amounts with different currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return {
    amount: a.amount.minus(b.amount),
    currency: a.currency,
  };
}

export function multiplyMoney<C extends CurrencyCode>(
  money: Money<C>,
  factor: Decimal.Value | Ratio,
): Money<C> {
  const decimalFactor = factor instanceof Decimal ? factor : new Decimal(factor);
  return {
    amount: money.amount.times(decimalFactor),
    currency: money.currency,
  };
}

export function divideMoney<C extends CurrencyCode>(
  money: Money<C>,
  divisor: Decimal.Value,
): Money<C> {
  const decimalDivisor = divisor instanceof Decimal ? divisor : new Decimal(divisor);
  if (decimalDivisor.isZero()) {
    throw new RangeError('Division by zero in money calculation');
  }
  return {
    amount: money.amount.dividedBy(decimalDivisor),
    currency: money.currency,
  };
}

export function sumMoney<C extends CurrencyCode>(
  items: readonly Money<C>[],
  currency: C,
): Money<C> {
  let total = zeroMoney(currency);
  for (const item of items) {
    total = addMoney(total, item);
  }
  return total;
}

// Allocates a total sum across ratios, preserving the exact total sum without rounding leakage.
export function allocateMoney<C extends CurrencyCode>(
  total: Money<C>,
  ratios: readonly Ratio[],
): readonly Money<C>[] {
  if (ratios.length === 0) {
    return [];
  }

  const ratioSum = ratios.reduce((acc, r) => acc.plus(new Decimal(r)), new Decimal(0));
  if (ratioSum.isZero()) {
    throw new RangeError('Sum of allocation ratios cannot be zero');
  }

  let remainder = total.amount;
  const results: Money<C>[] = [];

  for (let i = 0; i < ratios.length; i += 1) {
    const ratio = ratios[i];
    if (ratio === undefined) {
      continue;
    }
    if (i === ratios.length - 1) {
      // Last portion receives remaining balance to ensure exact match
      results.push(createMoney(remainder, total.currency));
    } else {
      const share = total.amount
        .times(new Decimal(ratio))
        .dividedBy(ratioSum)
        .toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
      results.push(createMoney(share, total.currency));
      remainder = remainder.minus(share);
    }
  }

  return results;
}
