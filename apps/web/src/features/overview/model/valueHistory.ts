// Portfolio value over time in the base currency (UI spec 7.1 value chart). Pure.
// Each day counts only lots bought on or before it, prices carry forward across market holidays,
// and every value converts at that day's FX rate.

import { Decimal } from 'decimal.js';

import type {
  FxRateHistoryDto,
  HoldingDto,
  InstrumentDto,
  PriceBarDto,
} from '../../../data/schemas';
import type { FxQuote } from '../../../shared/money';
import { findFxRate } from '../../../shared/money';
import type { BaseCurrencyCode, CurrencyCode } from '../../../shared/types/currency';

export type ValuePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const VALUE_PERIODS: readonly ValuePeriod[] = ['1M', '3M', '6M', '1Y', 'ALL'];

const PERIOD_DAYS: Readonly<Record<ValuePeriod, number | null>> = {
  '1M': 31,
  '3M': 92,
  '6M': 183,
  '1Y': 366,
  ALL: null,
};
const DAY_MS = 86_400_000;

export interface ValueSeries {
  readonly dates: readonly string[];
  readonly values: readonly number[];
  readonly currency: BaseCurrencyCode;
}

export interface ValueHistoryInputs {
  readonly holdings: readonly HoldingDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly priceHistories: ReadonlyMap<string, readonly PriceBarDto[]>;
  readonly fxHistories: readonly FxRateHistoryDto[];
  readonly baseCurrency: BaseCurrencyCode;
}

interface Track {
  readonly currency: CurrencyCode;
  readonly lots: readonly { readonly date: string; readonly quantity: Decimal }[];
  readonly closes: ReadonlyMap<string, Decimal>;
}

function buildTracks(inputs: ValueHistoryInputs): readonly Track[] {
  return inputs.holdings.flatMap((holding) => {
    const bars = inputs.priceHistories.get(holding.instrumentId);
    const instrument = inputs.instruments.find((item) => item.id === holding.instrumentId);
    if (bars === undefined || instrument === undefined) {
      return [];
    }
    return [
      {
        currency: instrument.currency,
        lots: holding.lots.map((lot) => ({
          date: lot.purchaseDate,
          quantity: new Decimal(lot.quantity),
        })),
        closes: new Map(bars.map((bar) => [bar.timestamp.slice(0, 10), new Decimal(bar.close)])),
      },
    ];
  });
}

function periodStart(lastDate: string | undefined, period: ValuePeriod): string {
  const days = PERIOD_DAYS[period];
  if (lastDate === undefined || days === null) {
    return '';
  }
  return new Date(Date.parse(`${lastDate}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
}

export function buildValueSeries(inputs: ValueHistoryInputs, period: ValuePeriod): ValueSeries {
  const tracks = buildTracks(inputs);
  const dates = [...new Set(tracks.flatMap((track) => [...track.closes.keys()]))].sort();
  const start = periodStart(dates[dates.length - 1], period);
  const fxSeries = inputs.fxHistories.map((history) => ({
    from: history.from,
    to: history.to,
    rates: new Map<string, Decimal>(
      history.points.map((point) => [point.date, new Decimal(point.rate)]),
    ),
  }));

  const lastClose = new Map<number, Decimal>();
  const lastRate = new Map<string, FxQuote>();
  const outDates: string[] = [];
  const outValues: number[] = [];

  for (const date of dates) {
    for (const pair of fxSeries) {
      const rate = pair.rates.get(date);
      if (rate !== undefined) {
        lastRate.set(`${pair.from}-${pair.to}`, { from: pair.from, to: pair.to, rate });
      }
    }
    for (const [index, track] of tracks.entries()) {
      const close = track.closes.get(date);
      if (close !== undefined) {
        lastClose.set(index, close);
      }
    }
    if (date < start) {
      continue;
    }

    const table = [...lastRate.values()];
    let total = new Decimal(0);
    let complete = true;
    for (const [index, track] of tracks.entries()) {
      const quantity = track.lots.reduce(
        (held, lot) => (lot.date <= date ? held.plus(lot.quantity) : held),
        new Decimal(0),
      );
      const close = lastClose.get(index);
      if (quantity.isZero() || close === undefined) {
        continue;
      }
      const rate = findFxRate(table, track.currency, inputs.baseCurrency);
      if (rate === undefined) {
        complete = false;
        break;
      }
      total = total.plus(quantity.times(close).times(rate));
    }
    // Days before an FX rate exists for a held currency are left out rather than shown wrong.
    if (complete) {
      outDates.push(date);
      outValues.push(total.toDecimalPlaces(2).toNumber());
    }
  }

  return { dates: outDates, values: outValues, currency: inputs.baseCurrency };
}
