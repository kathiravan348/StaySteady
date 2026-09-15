// Branded currency and FX rate types (standards 6.4).
// Prevents mixing amounts in different currencies or confusing base with local currency.

import type { Brand } from './brand';
import type { IsoUtcTimestamp } from './dateTime';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'INR',
  'EUR',
  'GBP',
  'JPY',
  'SGD',
  'HKD',
  'CAD',
  'AUD',
  'CHF',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'] as const;
export type BaseCurrencyCode = (typeof BASE_CURRENCIES)[number];

export type BaseCurrencyAmount<C extends BaseCurrencyCode = BaseCurrencyCode, T = unknown> = Brand<
  T,
  `BaseCurrencyAmount_${C}`
>;

export type LocalCurrencyAmount<C extends CurrencyCode = CurrencyCode, T = unknown> = Brand<
  T,
  `LocalCurrencyAmount_${C}`
>;

export interface FxRate<
  From extends CurrencyCode = CurrencyCode,
  To extends CurrencyCode = CurrencyCode,
> {
  readonly from: From;
  readonly to: To;
  readonly rate: number;
  readonly timestamp: IsoUtcTimestamp;
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

export function isBaseCurrencyCode(value: unknown): value is BaseCurrencyCode {
  return typeof value === 'string' && BASE_CURRENCIES.includes(value as BaseCurrencyCode);
}

export function toCurrencyCode(value: unknown): CurrencyCode {
  if (isCurrencyCode(value)) {
    return value;
  }
  throw new TypeError(
    `Unsupported currency code "${String(value)}". Supported: ${SUPPORTED_CURRENCIES.join(', ')}`,
  );
}

export function toBaseCurrencyCode(value: unknown): BaseCurrencyCode {
  if (isBaseCurrencyCode(value)) {
    return value;
  }
  throw new TypeError(
    `Unsupported base currency code "${String(value)}". Supported: ${BASE_CURRENCIES.join(', ')}`,
  );
}

export function createFxRate<From extends CurrencyCode, To extends CurrencyCode>(
  from: From,
  to: To,
  rate: number,
  timestamp: IsoUtcTimestamp,
): FxRate<From, To> {
  if (rate <= 0 || !Number.isFinite(rate)) {
    throw new TypeError(`FX rate must be a positive finite number, received: ${rate}`);
  }
  return { from, to, rate, timestamp };
}
