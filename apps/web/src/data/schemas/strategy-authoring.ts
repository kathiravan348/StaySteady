// Creating and saving strategy definitions (UI spec 7.7, 7.8). A strategy starts blank, from a
// starter template or as a copy of an existing one; every save is a numbered version on the server.

import { z } from 'zod';

import { StrategyIdSchema } from './common';
import {
  AllocationLimitsSchema,
  ForcedExitSchema,
  HoldingPeriodSchema,
  PositionSizingSchema,
  RuleGroupSchema,
  StrategyDraftSchema,
  StrategyVersionListSchema,
} from './strategy-rules';

// Bar sizes a strategy can be evaluated on. The preview and backtests use daily history, so
// intraday choices are recorded for the live layer and flagged where they matter.
export const StrategyTimeframeSchema = z.enum(['1h', '4h', '1d', '1w']);
export type StrategyTimeframeDto = z.infer<typeof StrategyTimeframeSchema>;

export const StrategyTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // One sentence on the idea, in plain words, shown when choosing a starting point.
  idea: z.string().min(1),
  suitsLabel: z.string().min(1),
  timeframe: StrategyTimeframeSchema,
  entry: RuleGroupSchema,
  exit: RuleGroupSchema,
  forcedExit: ForcedExitSchema,
  sizing: PositionSizingSchema,
  allocation: AllocationLimitsSchema,
  holdingPeriod: HoldingPeriodSchema,
});
export type StrategyTemplateDto = z.infer<typeof StrategyTemplateSchema>;

export const StrategyTemplateListSchema = z.array(StrategyTemplateSchema);

export const StrategySourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('blank') }),
  z.object({ kind: z.literal('template'), templateId: z.string().min(1) }),
  z.object({ kind: z.literal('duplicate'), strategyId: StrategyIdSchema }),
]);
export type StrategySourceDto = z.infer<typeof StrategySourceSchema>;

export const StrategyNameSchema = z
  .string()
  .trim()
  .min(3, 'Give the strategy a name of at least 3 characters.')
  .max(80, 'Keep the name under 80 characters.');

export const CreateStrategyRequestSchema = z.object({
  name: StrategyNameSchema,
  description: z.string().trim().max(280, 'Keep the description under 280 characters.'),
  source: StrategySourceSchema,
});
export type CreateStrategyRequestDto = z.infer<typeof CreateStrategyRequestSchema>;

export const SaveStrategyRequestSchema = z.object({
  draft: StrategyDraftSchema.extend({
    name: StrategyNameSchema,
    description: z.string().trim().max(280, 'Keep the description under 280 characters.'),
    timeframe: StrategyTimeframeSchema,
  }),
  summary: z.string().trim().min(1, 'Say what changed in this version.').max(200),
});
export type SaveStrategyRequestDto = z.infer<typeof SaveStrategyRequestSchema>;

// A save answers with the stored definition and its whole history, which replace the cache.
export const SavedStrategySchema = z.object({
  draft: StrategyDraftSchema,
  versions: StrategyVersionListSchema,
});
export type SavedStrategyDto = z.infer<typeof SavedStrategySchema>;
