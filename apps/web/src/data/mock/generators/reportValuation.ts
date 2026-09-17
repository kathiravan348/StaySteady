// Valuation helpers for reports (UI spec 7.16): what each holding was worth on any date, in any report
// currency, from the same lots, price history and FX history the portfolio screens use.

import { Decimal } from 'decimal.js';

import type {
  HoldingDto,
  InstrumentDto,
  MarketConfigInput,
  ReportCurrencyDto,
  TaxRuleSetConfigInput,
  TransactionDto,
} from '../../schemas';
import type { MockGeneratorContext } from './mockContext';
import { getInstrumentById } from './canonicalInstruments';
import { generateFxHistories } from './fxHistory';
import { generatePriceHistoryForInstrument } from './priceHistory';

const DAY_MS = 86_400_000;

export const addDays = (iso: string, days: number): string =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (from: string, to: string): number =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS,
  );

interface DatedValue {
  readonly date: string;
  readonly value: Decimal;
}

// The last value on or before the date, or null when the series starts later.
function valueOn(series: readonly DatedValue[], date: string): Decimal | null {
  let low = 0;
  let high = series.length - 1;
  let found: Decimal | null = null;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const point = series[mid];
    if (point === undefined) break;
    if (point.date <= date) {
      found = point.value;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

export interface ValuationContext {
  readonly holdings: readonly HoldingDto[];
  readonly transactions: readonly TransactionDto[];
  readonly markets: readonly MarketConfigInput[];
  // The residence tax rule set (decision 45); null when none is configured.
  readonly taxRules: TaxRuleSetConfigInput | null;
  readonly strategyNames: ReadonlyMap<string, string>;
  readonly instrument: (id: string) => InstrumentDto | undefined;
  // Closing price on or before the date, in the instrument's currency.
  readonly close: (instrumentId: string, date: string) => Decimal | null;
  // Units of `to` per unit of `from` on or before the date.
  readonly fx: (from: string, to: string, date: string) => Decimal;
  readonly quantity: (holding: HoldingDto, date: string) => Decimal;
  // A holding's value on the date in the report currency; zero before its first purchase.
  readonly holdingValue: (
    holding: HoldingDto,
    date: string,
    currency: ReportCurrencyDto,
  ) => Decimal;
}

export function createValuationContext(
  ctx: MockGeneratorContext,
  holdings: readonly HoldingDto[],
  transactions: readonly TransactionDto[],
  markets: readonly MarketConfigInput[],
  strategyNames: ReadonlyMap<string, string>,
  taxRules: TaxRuleSetConfigInput | null = null,
): ValuationContext {
  const prices = new Map<string, DatedValue[]>();
  const closeSeries = (instrumentId: string): readonly DatedValue[] => {
    const cached = prices.get(instrumentId);
    if (cached !== undefined) return cached;
    const instrument = getInstrumentById(instrumentId);
    const series =
      instrument === undefined
        ? []
        : generatePriceHistoryForInstrument(ctx, instrument).map((bar) => ({
            date: bar.timestamp.slice(0, 10),
            value: new Decimal(bar.close),
          }));
    prices.set(instrumentId, series);
    return series;
  };

  const pairs = new Map(
    generateFxHistories(ctx).map((history) => [
      `${history.from}/${history.to}`,
      history.points.map((point) => ({ date: point.date, value: new Decimal(point.rate) })),
    ]),
  );
  const direct = (from: string, to: string, date: string): Decimal | null => {
    if (from === to) return new Decimal(1);
    const rate = valueOn(pairs.get(`${from}/${to}`) ?? [], date);
    if (rate !== null) return rate;
    const inverse = valueOn(pairs.get(`${to}/${from}`) ?? [], date);
    return inverse === null ? null : new Decimal(1).dividedBy(inverse);
  };
  // Pairs are quoted against USD; any other pair crosses through it.
  const fx = (from: string, to: string, date: string): Decimal =>
    direct(from, to, date) ??
    (direct(from, 'USD', date) ?? new Decimal(1)).times(direct('USD', to, date) ?? new Decimal(1));

  const close = (instrumentId: string, date: string): Decimal | null =>
    valueOn(closeSeries(instrumentId), date);

  const quantity = (holding: HoldingDto, date: string): Decimal =>
    holding.lots
      .filter((lot) => lot.purchaseDate <= date)
      .reduce((sum, lot) => sum.plus(lot.quantity), new Decimal(0));

  return {
    holdings,
    transactions,
    markets,
    taxRules,
    strategyNames,
    instrument: getInstrumentById,
    close,
    fx,
    quantity,
    holdingValue: (holding, date, currency) => {
      const instrument = getInstrumentById(String(holding.instrumentId));
      const price = close(String(holding.instrumentId), date);
      const units = quantity(holding, date);
      if (instrument === undefined || price === null || units.isZero()) return new Decimal(0);
      return units.times(price).times(fx(instrument.currency, currency, date));
    },
  };
}

// Days to sample a period at: daily up to six months, weekly beyond, always including both ends.
export function sampleDates(from: string, to: string): readonly string[] {
  const span = daysBetween(from, to);
  const step = span > 183 ? 7 : 1;
  const dates: string[] = [];
  for (let offset = 0; offset < span; offset += step) dates.push(addDays(from, offset));
  dates.push(to);
  return dates;
}

export const money = (
  value: Decimal,
  currency: ReportCurrencyDto,
): { amount: string; currency: ReportCurrencyDto } => ({
  amount: value.toFixed(2),
  currency,
});
