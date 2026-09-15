// Currency conversion, comparisons and return metrics (standards 6.4).

import { Decimal } from 'decimal.js';
import type { CurrencyCode, FxRate } from '../types/currency';
import type { Percentage, Ratio } from '../types/quantities';
import { toPercentage, toRatio } from '../types/quantities';
import type { Money } from './money';
import { createMoney } from './money';

export interface GainLoss<C extends CurrencyCode = CurrencyCode> {
  readonly absolute: Money<C>;
  readonly percentage: Percentage;
  readonly ratio: Ratio;
  readonly direction: 'gain' | 'loss' | 'flat';
}

export function convertCurrency<From extends CurrencyCode, To extends CurrencyCode>(
  money: Money<From>,
  rate: FxRate<From, To>,
): Money<To> {
  if (money.currency !== rate.from) {
    throw new TypeError(
      `Mismatched FX conversion from ${money.currency}; rate is for ${rate.from} -> ${rate.to}`,
    );
  }
  const convertedAmount = money.amount.times(new Decimal(rate.rate));
  return createMoney(convertedAmount, rate.to);
}

export function compareMoney<C extends CurrencyCode>(a: Money<C>, b: Money<C>): -1 | 0 | 1 {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot compare amounts in different currencies: ${a.currency} and ${b.currency}`,
    );
  }
  const cmp = a.amount.comparedTo(b.amount);
  if (cmp > 0) {
    return 1;
  }
  if (cmp < 0) {
    return -1;
  }
  return 0;
}

export function equalsMoney<C extends CurrencyCode>(a: Money<C>, b: Money<C>): boolean {
  return a.currency === b.currency && a.amount.equals(b.amount);
}

export function isMoneyPositive<C extends CurrencyCode>(money: Money<C>): boolean {
  return money.amount.isPositive() && !money.amount.isZero();
}

export function isMoneyNegative<C extends CurrencyCode>(money: Money<C>): boolean {
  return money.amount.isNegative();
}

export function isMoneyZero<C extends CurrencyCode>(money: Money<C>): boolean {
  return money.amount.isZero();
}

export function calculateGainLoss<C extends CurrencyCode>(
  current: Money<C>,
  costBasis: Money<C>,
): GainLoss<C> {
  if (current.currency !== costBasis.currency) {
    throw new TypeError(
      `Cannot calculate gain/loss across currencies: ${current.currency} vs ${costBasis.currency}`,
    );
  }

  const absoluteDiff = current.amount.minus(costBasis.amount);
  const absolute = createMoney(absoluteDiff, current.currency);

  if (costBasis.amount.isZero()) {
    const direction = absoluteDiff.isPositive()
      ? 'gain'
      : absoluteDiff.isNegative()
        ? 'loss'
        : 'flat';
    return {
      absolute,
      percentage: toPercentage(0),
      ratio: toRatio(0),
      direction,
    };
  }

  const rawRatio = absoluteDiff.dividedBy(costBasis.amount);
  const rawPercentage = rawRatio.times(100);

  const direction = absoluteDiff.isPositive()
    ? 'gain'
    : absoluteDiff.isNegative()
      ? 'loss'
      : 'flat';

  return {
    absolute,
    percentage: toPercentage(rawPercentage.toNumber()),
    ratio: toRatio(rawRatio.toNumber()),
    direction,
  };
}
