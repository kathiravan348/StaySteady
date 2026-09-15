// Period statistics from daily history for the quote panel (UI spec 7.4 period range). Pure.

import { Decimal } from 'decimal.js';

import type { PriceBarDto } from '../../../../data/schemas';

export interface PeriodStats {
  readonly low: Decimal;
  readonly high: Decimal;
  readonly averageVolume: number;
  readonly barCount: number;
}

const TRADING_DAYS_PER_YEAR = 252;

export function trailingStats(
  bars: readonly PriceBarDto[],
  count = TRADING_DAYS_PER_YEAR,
): PeriodStats | null {
  const window = bars.slice(-count);
  const first = window[0];
  if (first === undefined) {
    return null;
  }
  let low = new Decimal(first.low);
  let high = new Decimal(first.high);
  let volume = 0;
  window.forEach((bar) => {
    low = Decimal.min(low, bar.low);
    high = Decimal.max(high, bar.high);
    volume += bar.volume;
  });
  return { low, high, averageVolume: Math.round(volume / window.length), barCount: window.length };
}
