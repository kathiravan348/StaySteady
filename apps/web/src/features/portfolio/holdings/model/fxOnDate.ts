// Exchange rates as they stood on a past date: the last published rate on or before it, so a
// weekend purchase uses Friday's rate. Pure.

import { Decimal } from 'decimal.js';

import type { FxRateHistoryDto } from '../../../../data/schemas';
import type { FxQuote } from '../../../../shared/money';
import type { CurrencyCode } from '../../../../shared/types/currency';

interface IndexedPair {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly dates: readonly string[];
  readonly rates: readonly Decimal[];
}

export interface FxHistoryIndex {
  readonly pairs: readonly IndexedPair[];
}

export function indexFxHistories(histories: readonly FxRateHistoryDto[]): FxHistoryIndex {
  return {
    pairs: histories.map((history) => {
      const points = [...history.points].sort((a, b) => a.date.localeCompare(b.date));
      return {
        from: history.from,
        to: history.to,
        dates: points.map((point) => point.date),
        rates: points.map((point) => new Decimal(point.rate)),
      };
    }),
  };
}

// Index of the last date on or before `date`, or -1 when every date is later.
function lastIndexOnOrBefore(dates: readonly string[], date: string): number {
  let low = 0;
  let high = dates.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = dates[middle];
    if (candidate !== undefined && candidate <= date) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

export function fxTableOn(index: FxHistoryIndex, date: string): readonly FxQuote[] {
  return index.pairs.flatMap((pair) => {
    const rate = pair.rates[lastIndexOnOrBefore(pair.dates, date)];
    return rate === undefined ? [] : [{ from: pair.from, to: pair.to, rate }];
  });
}
