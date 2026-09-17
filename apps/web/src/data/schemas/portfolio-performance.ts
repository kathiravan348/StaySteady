// Portfolio performance at a glance (nav map 6, open question 9): value since the first purchase,
// returns for standard periods, monthly returns and contribution by holding. Returns are
// time-weighted, as in the performance report.

import { z } from 'zod';

import { IsoDateSchema, MoneySchema } from './common';
import { ReportCurrencySchema } from './reports';

export const PerformancePeriodSchema = z.object({
  id: z.enum(['1m', '3m', 'ytd', '1y', 'all']),
  label: z.string().min(1),
  from: IsoDateSchema,
  to: IsoDateSchema,
  // Null when the portfolio held nothing for the whole period.
  returnPercent: z.number().nullable(),
  gain: MoneySchema,
});
export type PerformancePeriodDto = z.infer<typeof PerformancePeriodSchema>;

export const PortfolioPerformanceSchema = z.object({
  currency: ReportCurrencySchema,
  asOf: IsoDateSchema,
  inception: IsoDateSchema,
  value: MoneySchema,
  // Weekly points since the first purchase.
  series: z.array(z.object({ date: IsoDateSchema, value: z.number() })),
  periods: z.array(PerformancePeriodSchema),
  monthly: z.array(
    z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      returnPercent: z.number(),
    }),
  ),
  contributions: z.array(
    z.object({
      instrumentId: z.string().min(1),
      symbol: z.string().min(1),
      gain: MoneySchema,
      sharePercent: z.number().nullable(),
    }),
  ),
});
export type PortfolioPerformanceDto = z.infer<typeof PortfolioPerformanceSchema>;
