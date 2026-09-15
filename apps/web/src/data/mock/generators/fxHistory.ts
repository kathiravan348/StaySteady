// Multi-year exchange rate history and spot rates generator (M-08).
// Covers USD base pairs against INR, GBP, JPY, SGD, EUR across full price history period.

import { Decimal } from 'decimal.js';
import type { CurrencyCode } from '../../../shared/types/currency';
import type { FxRateDto, FxRateHistoryDto, FxRatePointDto } from '../../schemas';
import { FxRateSchema, FxRateHistorySchema } from '../../schemas';
import { parseGenerated, parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { daysBetween } from './values';
import { PRICE_HISTORY_ORIGIN_DATE } from './priceHistory';
import type { IsoDate } from '../../../shared/types/dateTime';
import { toIsoDate } from '../../../shared/types/dateTime';

interface FxPairConfig {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly baseRate: number;
  readonly dailyDrift: number;
  readonly dailyVol: number;
  readonly decimals: number;
}

const CANONICAL_FX_PAIRS: readonly FxPairConfig[] = [
  { from: 'USD', to: 'INR', baseRate: 75.5, dailyDrift: 0.0001, dailyVol: 0.002, decimals: 4 },
  { from: 'GBP', to: 'USD', baseRate: 1.35, dailyDrift: -0.00003, dailyVol: 0.004, decimals: 4 },
  { from: 'EUR', to: 'USD', baseRate: 1.13, dailyDrift: -0.00002, dailyVol: 0.0038, decimals: 4 },
  { from: 'USD', to: 'JPY', baseRate: 115.0, dailyDrift: 0.00018, dailyVol: 0.0045, decimals: 3 },
  { from: 'USD', to: 'SGD', baseRate: 1.35, dailyDrift: -0.00001, dailyVol: 0.0022, decimals: 4 },
];

export function generateFxHistories(
  ctx: MockGeneratorContext,
  startDate: IsoDate = PRICE_HISTORY_ORIGIN_DATE,
): readonly FxRateHistoryDto[] {
  const totalDays = Math.max(1, daysBetween(startDate, toIsoDate(ctx.referenceTime.slice(0, 10))));

  const histories: FxRateHistoryDto[] = CANONICAL_FX_PAIRS.map((cfg) => {
    const stream = ctx.random.fork(`fx:${cfg.from}-${cfg.to}`);
    const points: FxRatePointDto[] = [];
    let current = new Decimal(cfg.baseRate);

    const cursor = new Date(`${startDate}T00:00:00Z`);

    for (let d = 0; d <= totalDays; d++) {
      const dayOfWeek = cursor.getUTCDay();
      const dateStr = cursor.toISOString().slice(0, 10) as IsoDate;

      // FX markets close on weekends (Sat/Sun)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const shock = stream.normal(cfg.dailyDrift, cfg.dailyVol);
        current = current.times(1 + shock).toDecimalPlaces(cfg.decimals);
        points.push({
          date: dateStr,
          rate: current.toFixed(cfg.decimals),
        });
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return {
      from: cfg.from,
      to: cfg.to,
      points,
    };
  });

  return parseGeneratedList(FxRateHistorySchema, histories, 'fxHistories');
}

export function generateCurrentFxRates(ctx: MockGeneratorContext): readonly FxRateDto[] {
  const histories = generateFxHistories(ctx);

  return histories.map((h) => {
    const lastPoint = h.points[h.points.length - 1];
    const rate = lastPoint ? lastPoint.rate : '1.0000';
    return parseGenerated(
      FxRateSchema,
      {
        from: h.from,
        to: h.to,
        rate,
        asOf: ctx.referenceTime,
      },
      `fxRate:${h.from}-${h.to}`,
    );
  });
}
