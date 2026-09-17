// Multi-year daily price history generator with realistic volatility (M-04).
// Walks forward from a fixed origin date so bars for past dates are deterministic and stable.

import { Decimal } from 'decimal.js';
import type { InstrumentDto, InstrumentTypeDto, PriceBarDto } from '../../schemas';
import { PriceBarSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { getMarketById } from './markets';
import { currencyDecimals, daysBetween } from './values';
import type { IsoDate, IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toIsoDate, toIsoUtcTimestamp } from '../../../shared/types/dateTime';

export const PRICE_HISTORY_ORIGIN_DATE: IsoDate = toIsoDate('2022-01-03');

interface VolatilityConfig {
  readonly dailyDrift: number;
  readonly dailyVol: number;
  readonly basePrice: number;
}

function getVolatilityConfig(type: InstrumentTypeDto, currency: string): VolatilityConfig {
  if (currency === 'JPY') {
    return { dailyDrift: 0.0002, dailyVol: 0.013, basePrice: 2400 };
  }
  if (currency === 'INR') {
    return { dailyDrift: 0.0003, dailyVol: 0.014, basePrice: 1500 };
  }
  switch (type) {
    case 'digital_asset':
      return { dailyDrift: 0.0005, dailyVol: 0.038, basePrice: 42000 };
    case 'bond':
    case 'unlisted':
      return { dailyDrift: 0.00005, dailyVol: 0.0025, basePrice: 98 };
    case 'commodity':
      return { dailyDrift: 0.0002, dailyVol: 0.015, basePrice: 1950 };
    case 'currency_pair':
      return { dailyDrift: 0.00002, dailyVol: 0.0045, basePrice: 1.1 };
    case 'etf':
    case 'mutual_fund':
      return { dailyDrift: 0.0003, dailyVol: 0.009, basePrice: 380 };
    case 'swing':
    case 'intraday':
      return { dailyDrift: 0.0003, dailyVol: 0.024, basePrice: 180 };
    default:
      return { dailyDrift: 0.0003, dailyVol: 0.014, basePrice: 150 };
  }
}

// Generating and validating ~1,200 bars is costly, and quotes, holdings and handlers all reuse the
// same series. Streams are forked by key, so a cached series is identical to a regenerated one.
const historyCache = new Map<string, readonly PriceBarDto[]>();

export function generatePriceHistoryForInstrument(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  startDate: IsoDate = PRICE_HISTORY_ORIGIN_DATE,
): readonly PriceBarDto[] {
  const key = `${ctx.random.seedKey}|${instrument.id}|${startDate}|${ctx.referenceTime}`;
  const cached = historyCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const bars = buildPriceHistory(ctx, instrument, startDate);
  historyCache.set(key, bars);
  return bars;
}

function buildPriceHistory(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  startDate: IsoDate,
): readonly PriceBarDto[] {
  const stream = ctx.random.fork(`prices:${instrument.id}`);
  const market = getMarketById(instrument.marketId);
  const holidaySet = new Set(market?.holidays.map((h) => h.date) ?? []);
  const decimals = currencyDecimals(instrument.currency);
  const cfg = getVolatilityConfig(instrument.type, instrument.currency);

  const totalDays = Math.max(1, daysBetween(startDate, toIsoDate(ctx.referenceTime.slice(0, 10))));
  const bars: PriceBarDto[] = [];
  let currentClose = new Decimal(cfg.basePrice);

  const cursor = new Date(`${startDate}T00:00:00Z`);

  for (let d = 0; d <= totalDays; d++) {
    const dayOfWeek = cursor.getUTCDay();
    const isoDateStr = cursor.toISOString().slice(0, 10);

    // Skip weekends (0=Sun, 6=Sat) and market holidays
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(toIsoDate(isoDateStr));

    if (!isWeekend && !isHoliday) {
      const returnSample = stream.normal(cfg.dailyDrift, cfg.dailyVol);
      const openShock = stream.normal(0, cfg.dailyVol * 0.35);
      const open = currentClose.times(1 + openShock).toDecimalPlaces(decimals);
      const close = open.times(1 + returnSample).toDecimalPlaces(decimals);

      const maxOc = Decimal.max(open, close);
      const minOc = Decimal.min(open, close);
      const intraVol = Math.abs(stream.normal(0, cfg.dailyVol * 0.6));
      const high = maxOc.times(1 + intraVol).toDecimalPlaces(decimals);
      const low = minOc.times(1 - intraVol).toDecimalPlaces(decimals);

      const volMultiplier = stream.float(0.6, 1.8);
      const baseVol =
        instrument.type === 'etf' || instrument.type === 'intraday' ? 2_500_000 : 350_000;
      const volume = Math.round(baseVol * volMultiplier);

      const timestamp: IsoUtcTimestamp = toIsoUtcTimestamp(
        new Date(cursor.getTime() + 16 * 3600 * 1000),
      );

      bars.push({
        timestamp,
        open: open.toFixed(decimals),
        high: high.toFixed(decimals),
        low: low.toFixed(decimals),
        close: close.toFixed(decimals),
        volume,
        session: 'regular',
        isEstimated: false,
      });

      currentClose = close;
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return parseGeneratedList(PriceBarSchema, bars, `priceHistory:${instrument.id}`);
}
