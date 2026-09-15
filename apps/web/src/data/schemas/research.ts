import { z } from 'zod';

import {
  BacktestIdSchema,
  InstrumentIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  PercentageSchema,
  StrategyIdSchema,
} from './common';

// Requirements 15 — lifecycle stages in strict order; a strategy advances only by deliberate action.
export const StrategyStageSchema = z.enum([
  'draft',
  'backtested',
  'observation',
  'semi_automatic',
  'fully_automatic',
]);
export type StrategyStageDto = z.infer<typeof StrategyStageSchema>;

export const StrategySchema = z.object({
  id: StrategyIdSchema,
  name: z.string().min(1),
  description: z.string(),
  version: z.string(),
  stage: StrategyStageSchema,
  universe: z.array(InstrumentIdSchema),
  timeframe: z.string(),
  parameters: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  createdAt: IsoUtcTimestampSchema,
  updatedAt: IsoUtcTimestampSchema,
});
export type StrategyDto = z.infer<typeof StrategySchema>;

export const BacktestMetricsSchema = z.object({
  cagr: PercentageSchema,
  sharpeRatio: z.number(),
  sortinoRatio: z.number(),
  maxDrawdown: PercentageSchema,
  winRate: PercentageSchema,
  profitFactor: z.number(),
  totalTrades: z.number().int().nonnegative(),
  calmarRatio: z.number().optional(),
});
export type BacktestMetricsDto = z.infer<typeof BacktestMetricsSchema>;

export const BacktestResultSchema = z.object({
  id: BacktestIdSchema,
  strategyId: StrategyIdSchema,
  startDate: IsoDateSchema,
  endDate: IsoDateSchema,
  initialCapital: MoneySchema,
  finalCapital: MoneySchema,
  totalReturn: MoneySchema,
  totalReturnPercent: PercentageSchema,
  metrics: BacktestMetricsSchema,
  hasOutlierDependency: z.boolean(),
  createdAt: IsoUtcTimestampSchema,
});
export type BacktestResultDto = z.infer<typeof BacktestResultSchema>;
