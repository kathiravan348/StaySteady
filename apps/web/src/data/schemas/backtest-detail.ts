import { z } from 'zod';

import {
  BacktestIdSchema,
  InstrumentIdSchema,
  IsoDateSchema,
  MoneySchema,
  PercentageSchema,
} from './common';

// UI spec 7.10 and section 8 — everything the results screen shows beyond the headline result.

export const EquityPointSchema = z.object({
  date: IsoDateSchema,
  equity: z.number(),
  benchmark: z.number().nullable(),
  // Percentage below the running peak, at or below zero.
  drawdownPercent: z.number().max(0),
});
export type EquityPointDto = z.infer<typeof EquityPointSchema>;

export const MonthlyReturnSchema = z.object({
  year: z.number().int(),
  // 1 to 12.
  month: z.number().int().min(1).max(12),
  returnPercent: z.number(),
});

// A metric with its plain-language explanation (UI spec 8.2: every metric explains itself).
export const MetricEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  explanation: z.string().min(1),
  limitation: z.string().min(1).nullable(),
});
export type MetricEntryDto = z.infer<typeof MetricEntrySchema>;

export const MetricGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  metrics: z.array(MetricEntrySchema).min(1),
});
export type MetricGroupDto = z.infer<typeof MetricGroupSchema>;

export const BreakdownRowSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  trades: z.number().int().nonnegative(),
  returnPercent: PercentageSchema,
  contribution: MoneySchema,
  winRatePercent: PercentageSchema,
});
export type BreakdownRowDto = z.infer<typeof BreakdownRowSchema>;

export const BreakdownGroupSchema = z.object({
  id: z.enum(['year', 'market', 'instrumentType', 'currency']),
  title: z.string().min(1),
  rows: z.array(BreakdownRowSchema),
});
export type BreakdownGroupDto = z.infer<typeof BreakdownGroupSchema>;

export const CostBreakdownSchema = z.object({
  fees: MoneySchema,
  slippage: MoneySchema,
  currencyConversion: MoneySchema,
  total: MoneySchema,
  grossReturn: MoneySchema,
  netReturn: MoneySchema,
  costsAsPercentOfGross: z.number(),
  averageCostPerTrade: MoneySchema,
});
export type CostBreakdownDto = z.infer<typeof CostBreakdownSchema>;

export const SensitivityPointSchema = z.object({
  parameter: z.string().min(1),
  value: z.string().min(1),
  returnPercent: PercentageSchema,
  isChosen: z.boolean(),
});

export const ValidationSchema = z.object({
  inSample: z.object({
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    returnPercent: PercentageSchema,
    sharpeRatio: z.number(),
  }),
  outOfSample: z.object({
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    returnPercent: PercentageSchema,
    sharpeRatio: z.number(),
  }),
  sensitivity: z.array(SensitivityPointSchema),
  // Share of total profit from the best few trades (UI spec 8.2 outlier dependency check).
  topTradeSharePercent: z.number(),
  topTradeCount: z.number().int().positive(),
  tradesNeededForHalfProfit: z.number().int().nonnegative(),
});
export type ValidationDto = z.infer<typeof ValidationSchema>;

export const BacktestDetailSchema = z.object({
  backtestId: BacktestIdSchema,
  benchmarkLabel: z.string().min(1).nullable(),
  equityCurve: z.array(EquityPointSchema).min(2),
  monthlyReturns: z.array(MonthlyReturnSchema),
  metricGroups: z.array(MetricGroupSchema).min(1),
  breakdowns: z.array(BreakdownGroupSchema).min(1),
  costs: CostBreakdownSchema,
  validation: ValidationSchema,
  // Instruments the run traded, for the trade list and breakdowns.
  instrumentIds: z.array(InstrumentIdSchema),
  estimatedBars: z.number().int().nonnegative(),
});
export type BacktestDetailDto = z.infer<typeof BacktestDetailSchema>;
