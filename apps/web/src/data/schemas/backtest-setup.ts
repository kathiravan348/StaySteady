import { z } from 'zod';

import {
  BacktestIdSchema,
  InstrumentIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MarketIdSchema,
  MoneySchema,
  StrategyIdSchema,
} from './common';

// UI spec 7.9 — backtest setup: cost assumptions, data coverage, the run configuration and its run.

// Basis points keep fee and slippage assumptions currency-neutral (100 bps = 1%).
export const CostAssumptionsSchema = z.object({
  commissionBps: z.number().min(0).max(500),
  minimumCommission: MoneySchema,
  slippageBps: z.number().min(0).max(500),
  fxConversionBps: z.number().min(0).max(500),
});
export type CostAssumptionsDto = z.infer<typeof CostAssumptionsSchema>;

// What live configuration uses today, per market, plus that market's usual benchmark.
export const MarketCostDefaultsSchema = z.object({
  marketId: MarketIdSchema,
  marketName: z.string().min(1),
  costs: CostAssumptionsSchema,
  benchmarkInstrumentId: InstrumentIdSchema.nullable(),
  benchmarkLabel: z.string().min(1).nullable(),
});
export type MarketCostDefaultsDto = z.infer<typeof MarketCostDefaultsSchema>;

export const BacktestGranularitySchema = z.enum(['1d', '1h', '15m']);
export type BacktestGranularityDto = z.infer<typeof BacktestGranularitySchema>;

// What history exists for an instrument, so the setup screen can warn before a run.
export const DataCoverageSchema = z.object({
  instrumentId: InstrumentIdSchema,
  symbol: z.string().min(1),
  marketId: MarketIdSchema,
  firstDate: IsoDateSchema,
  lastDate: IsoDateSchema,
  barCount: z.number().int().nonnegative(),
  estimatedBars: z.number().int().nonnegative(),
  missingTradingDays: z.number().int().nonnegative(),
});
export type DataCoverageDto = z.infer<typeof DataCoverageSchema>;

export const BacktestBenchmarkSchema = z.object({
  marketId: MarketIdSchema,
  instrumentId: InstrumentIdSchema.nullable(),
});

export const BacktestConfigSchema = z.object({
  strategyId: StrategyIdSchema,
  startDate: IsoDateSchema,
  endDate: IsoDateSchema,
  instrumentIds: z.array(InstrumentIdSchema).min(1, { error: 'Choose at least one instrument' }),
  initialCapital: MoneySchema,
  granularity: BacktestGranularitySchema,
  benchmarks: z.array(BacktestBenchmarkSchema),
  costs: CostAssumptionsSchema,
});
export type BacktestConfigDto = z.infer<typeof BacktestConfigSchema>;

export const BacktestRunStatusSchema = z.enum([
  'queued',
  'running',
  'completed',
  'cancelled',
  'failed',
]);
export type BacktestRunStatusDto = z.infer<typeof BacktestRunStatusSchema>;

export const BacktestRunSchema = z.object({
  id: z.string().min(1),
  status: BacktestRunStatusSchema,
  progressPercent: z.number().min(0).max(100),
  // Plain-language step, e.g. "Loading price history".
  stage: z.string().min(1),
  startedAt: IsoUtcTimestampSchema,
  completedAt: IsoUtcTimestampSchema.nullable(),
  resultId: BacktestIdSchema.nullable(),
  message: z.string().min(1).nullable(),
  config: BacktestConfigSchema,
});
export type BacktestRunDto = z.infer<typeof BacktestRunSchema>;

export const MarketCostDefaultsListSchema = z.array(MarketCostDefaultsSchema);
export const DataCoverageListSchema = z.array(DataCoverageSchema);
