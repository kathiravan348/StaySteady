// Core Money representation using decimal.js (standards 6.4 and decision 7).
// Prevents floating-point rounding errors and accidental mixing of currencies.

import { Decimal } from 'decimal.js';
import type { CurrencyCode } from '../types/currency';
import { isCurrencyCode, toCurrencyCode } from '../types/currency';

export interface Money<C extends CurrencyCode = CurrencyCode> {
  readonly amount: Decimal;
  readonly currency: C;
}

export function createMoney<C extends CurrencyCode>(
  value: Decimal.Value | Decimal,
  currency: C,
): Money<C> {
  const validatedCurrency = toCurrencyCode(currency) as C;
  try {
    const decimalAmount = value instanceof Decimal ? value : new Decimal(value);
    if (!decimalAmount.isFinite()) {
      throw new TypeError(`Money amount must be finite, received: ${String(value)}`);
    }
    return {
      amount: decimalAmount,
      currency: validatedCurrency,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw error;
    }
    throw new TypeError(`Invalid decimal value for money amount: ${String(value)}`);
  }
}

export function isMoney(value: unknown): value is Money {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'amount' in value &&
    value.amount instanceof Decimal &&
    'currency' in value &&
    isCurrencyCode(value.currency)
  );
}

export function zeroMoney<C extends CurrencyCode>(currency: C): Money<C> {
  return createMoney(0, currency);
}
