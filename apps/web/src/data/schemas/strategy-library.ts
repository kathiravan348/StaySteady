// Strategy Library entries (UI spec 7.7). A strategy on its own carries no allocation, live result
// or run status, so the library endpoint joins it to holdings and saved backtests.

import { z } from 'zod';

import {
  BacktestIdSchema,
  InstrumentIdSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  StrategyIdSchema,
} from './common';
import { StrategyStageSchema } from './research';

export const StrategyRunStatusSchema = z.enum(['succeeded', 'failed', 'running', 'never_run']);
export type StrategyRunStatusDto = z.infer<typeof StrategyRunStatusSchema>;

// How far live performance has drifted from what the backtest implied. 'unproven' keeps strategies
// with no live positions from looking aligned when nothing has actually been tested.
export const DivergenceSeveritySchema = z.enum(['aligned', 'watch', 'diverged', 'unproven']);
export type DivergenceSeverityDto = z.infer<typeof DivergenceSeveritySchema>;

export const StrategyBacktestHeadlineSchema = z.object({
  backtestId: BacktestIdSchema,
  totalReturnPercent: z.number(),
  cagr: z.number(),
  sharpeRatio: z.number(),
  maxDrawdown: z.number(),
  periodLabel: z.string().min(1),
});
export type StrategyBacktestHeadlineDto = z.infer<typeof StrategyBacktestHeadlineSchema>;

export const StrategyLiveResultSchema = z.object({
  returnPercent: z.number(),
  gainLoss: MoneySchema,
  openPositions: z.number().int().nonnegative(),
});
export type StrategyLiveResultDto = z.infer<typeof StrategyLiveResultSchema>;

export const StrategyDivergenceSchema = z.object({
  // Live return minus the backtest's annualised expectation, in percentage points.
  deltaPercentagePoints: z.number(),
  severity: DivergenceSeveritySchema,
  explanation: z.string().min(1),
});
export type StrategyDivergenceDto = z.infer<typeof StrategyDivergenceSchema>;

export const StrategyRunSchema = z.object({
  at: IsoUtcTimestampSchema,
  status: StrategyRunStatusSchema,
  message: z.string().min(1),
});
export type StrategyRunDto = z.infer<typeof StrategyRunSchema>;

export const StrategyLibraryEntrySchema = z.object({
  strategyId: StrategyIdSchema,
  name: z.string().min(1),
  description: z.string(),
  version: z.string().min(1),
  stage: StrategyStageSchema,
  timeframe: z.string().min(1),
  universe: z.array(InstrumentIdSchema),
  instrumentSymbols: z.array(z.string().min(1)),
  marketIds: z.array(z.string().min(1)),
  instrumentTypes: z.array(z.string().min(1)),
  allocatedCapital: MoneySchema,
  allocationPercent: z.number(),
  backtest: StrategyBacktestHeadlineSchema.nullable(),
  live: StrategyLiveResultSchema.nullable(),
  divergence: StrategyDivergenceSchema.nullable(),
  lastRun: StrategyRunSchema.nullable(),
});
export type StrategyLibraryEntryDto = z.infer<typeof StrategyLibraryEntrySchema>;

export const StrategyLibraryListSchema = z.array(StrategyLibraryEntrySchema);
