// Value helpers for mock datasets (M-03): exact decimal strings, money, ids and dates.

import { Decimal } from 'decimal.js';

import type { CurrencyCode } from '../../../shared/types/currency';
import type { IsoDate, IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toIsoDate, toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import type { DirectionDto, MoneyDto } from '../../schemas';
import type { SeededRandom } from './seededRandom';

const DAY_MS = 86_400_000;

// Same rule as shared/format/formatMoney: JPY has no minor unit, other supported currencies have two.
export function currencyDecimals(currency: CurrencyCode): number {
  return currency === 'JPY' ? 0 : 2;
}

export interface DecimalRange {
  readonly min: number;
  readonly max: number;
  readonly decimals: number;
}

// Picks a whole number of minor units, then scales, so the string is exact with no float rounding.
export function randomDecimalString(random: SeededRandom, range: DecimalRange): string {
  const scale = new Decimal(10).pow(range.decimals);
  const minUnits = new Decimal(range.min).times(scale).ceil().toNumber();
  const maxUnits = new Decimal(range.max).times(scale).floor().toNumber();
  return new Decimal(random.int(minUnits, maxUnits)).dividedBy(scale).toFixed(range.decimals);
}

export interface MoneyRange {
  readonly min: number;
  readonly max: number;
  readonly currency: CurrencyCode;
}

export function randomMoney(random: SeededRandom, range: MoneyRange): MoneyDto {
  return {
    amount: randomDecimalString(random, {
      min: range.min,
      max: range.max,
      decimals: currencyDecimals(range.currency),
    }),
    currency: range.currency,
  };
}

// Readable, stable ids: sequentialId('ord', 7) returns "ord-0007".
export function sequentialId(prefix: string, index: number, width = 4): string {
  return `${prefix}-${String(index).padStart(width, '0')}`;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return toIsoDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));
}

export function daysBetween(start: IsoDate, end: IsoDate): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS);
}

export function toUtcDate(timestamp: IsoUtcTimestamp): IsoDate {
  return toIsoDate(new Date(timestamp));
}

export function randomDateBetween(random: SeededRandom, start: IsoDate, end: IsoDate): IsoDate {
  return addDays(start, random.int(0, Math.max(0, daysBetween(start, end))));
}

// Whole seconds keep generated timestamps readable and stable.
export function randomTimestampBetween(
  random: SeededRandom,
  start: IsoUtcTimestamp,
  end: IsoUtcTimestamp,
): IsoUtcTimestamp {
  const from = Date.parse(start);
  const seconds = random.int(0, Math.max(0, Math.floor((Date.parse(end) - from) / 1000)));
  return toIsoUtcTimestamp(new Date(from + seconds * 1000));
}

// Direction repeats the sign of a value for convenience; the value itself stays signed.
export function directionOf(value: Decimal): DirectionDto {
  if (value.isZero()) {
    return 'neutral';
  }
  return value.isPositive() ? 'positive' : 'negative';
}

export interface SignedChange {
  readonly change: MoneyDto;
  readonly changePercent: number;
  readonly direction: DirectionDto;
}

// Change from a reference price, signed: negative when the price fell.
export function signedChange(
  current: Decimal,
  reference: Decimal,
  currency: CurrencyCode,
): SignedChange {
  const decimals = currencyDecimals(currency);
  const change = current.minus(reference).toDecimalPlaces(decimals);
  const changePercent = reference.isZero()
    ? 0
    : change.dividedBy(reference).times(100).toDecimalPlaces(2).toNumber();
  return {
    change: { amount: change.toFixed(decimals), currency },
    changePercent,
    direction: directionOf(change),
  };
}
