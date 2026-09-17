// Strategy retirement criteria and stage history (requirements 28 and 33; UI spec 19.2 and 19.4).
// Criteria are fixed when a strategy is promoted to a live stage; each stage change is recorded with
// what was measured at the time.

import { z } from 'zod';

import { IsoUtcTimestampSchema, StrategyIdSchema } from './common';
import { StrategyStageSchema } from './research';

export const RetirementCriteriaSchema = z.object({
  definedAt: IsoUtcTimestampSchema,
  definedAtStage: StrategyStageSchema,
  maxDrawdownPercent: z.number().positive().max(100),
  minRollingSharpe: z.number(),
  rollingWindowDays: z.number().int().positive(),
  // Live return may trail the backtest expectation by at most this many percentage points a year.
  maxUnderperformancePoints: z.number().nonnegative(),
  reviewEveryDays: z.number().int().positive(),
});
export type RetirementCriteriaDto = z.infer<typeof RetirementCriteriaSchema>;

export const StageMeasurementSchema = z.object({
  drawdownPercent: z.number(),
  rollingSharpe: z.number(),
  underperformancePoints: z.number(),
});
export type StageMeasurementDto = z.infer<typeof StageMeasurementSchema>;

export const StageChangeKindSchema = z.enum(['promotion', 'demotion']);
export type StageChangeKindDto = z.infer<typeof StageChangeKindSchema>;

export const StageChangeSchema = z.object({
  at: IsoUtcTimestampSchema,
  from: StrategyStageSchema.nullable(),
  to: StrategyStageSchema,
  kind: StageChangeKindSchema,
  reason: z.string().min(1),
  measured: StageMeasurementSchema.nullable(),
});
export type StageChangeDto = z.infer<typeof StageChangeSchema>;

export const StrategyLifecycleSchema = z.object({
  strategyId: StrategyIdSchema,
  // Null until the strategy has been promoted beyond backtesting.
  criteria: RetirementCriteriaSchema.nullable(),
  history: z.array(StageChangeSchema).min(1),
  lastReviewedAt: IsoUtcTimestampSchema.nullable(),
});
export type StrategyLifecycleDto = z.infer<typeof StrategyLifecycleSchema>;

export const StrategyLifecycleListSchema = z.array(StrategyLifecycleSchema);
export type StrategyLifecycleListDto = z.infer<typeof StrategyLifecycleListSchema>;
