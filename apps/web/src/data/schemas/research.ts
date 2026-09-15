import { z } from 'zod';
import {
  InstrumentIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  PercentageSchema,
  StrategyIdSchema,
} from './common';

export const StrategyStatusSchema = z.enum(['draft', 'backtesting', 'paper', 'live', 'retired']);
export type StrategyStatusDto = z.infer<typeof StrategyStatusSchema>;

export const StrategySchema = z.object({
  id: StrategyIdSchema,
  name: z.string().min(1),
  description: z.string(),
  version: z.string(),
  status: StrategyStatusSchema,
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
  id: z.string().min(1),
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
