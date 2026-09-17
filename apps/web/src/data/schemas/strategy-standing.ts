// How each strategy stands against the retirement criteria fixed at its promotion, and how closely
// the strategies' returns move together (E-08; requirements 28, 33).

import { z } from 'zod';

import { IsoDateSchema, StrategyIdSchema } from './common';
import { StrategyStageSchema } from './research';
import { StageMeasurementSchema } from './strategy-lifecycle';

export const StrategyStandingSchema = z.object({
  strategyId: StrategyIdSchema,
  name: z.string().min(1),
  stage: StrategyStageSchema,
  // live: measured now from open positions; at_demotion: last recorded, no positions since; none.
  source: z.enum(['live', 'at_demotion', 'none']),
  measured: StageMeasurementSchema.nullable(),
  // Each criterion the measurement breaks, in words.
  breaches: z.array(z.string().min(1)),
  nextReviewOn: IsoDateSchema.nullable(),
  isReviewOverdue: z.boolean(),
});
export type StrategyStandingDto = z.infer<typeof StrategyStandingSchema>;

export const StrategyCorrelationSchema = z.object({
  windowDays: z.number().int().positive(),
  strategyIds: z.array(StrategyIdSchema),
  names: z.array(z.string().min(1)),
  // Pearson correlation of daily returns; row and column order follow strategyIds.
  matrix: z.array(z.array(z.number().min(-1).max(1))),
});
export type StrategyCorrelationDto = z.infer<typeof StrategyCorrelationSchema>;

export const StrategyStandingViewSchema = z.object({
  standings: z.array(StrategyStandingSchema),
  correlation: StrategyCorrelationSchema,
  // Correlation above this counts as not independent.
  correlationWarning: z.number().min(0).max(1),
});
export type StrategyStandingViewDto = z.infer<typeof StrategyStandingViewSchema>;
