// Strategy definition (UI spec 7.8). A strategy is defined without system-level code, so the rules
// are data: a tree of conditions and groups the editor can add to, group and nest.

import { z } from 'zod';

import { InstrumentIdSchema, IsoUtcTimestampSchema, StrategyIdSchema } from './common';
import { StrategyStageSchema } from './research';

export const PriceFieldSchema = z.enum(['open', 'high', 'low', 'close', 'volume']);
export type PriceFieldDto = z.infer<typeof PriceFieldSchema>;

export const IndicatorKindSchema = z.enum([
  'sma',
  'ema',
  'rsi',
  'macd',
  'atr',
  'stochastic_k',
  'bollinger_upper',
  'bollinger_lower',
]);
export type IndicatorKindDto = z.infer<typeof IndicatorKindSchema>;

export const RuleOperandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('price'), field: PriceFieldSchema }),
  z.object({
    kind: z.literal('indicator'),
    indicator: IndicatorKindSchema,
    period: z.number().int().min(1).max(400),
  }),
  z.object({ kind: z.literal('number'), value: z.number() }),
]);
export type RuleOperandDto = z.infer<typeof RuleOperandSchema>;

export const ComparatorSchema = z.enum([
  'crosses_above',
  'crosses_below',
  'greater_than',
  'less_than',
]);
export type ComparatorDto = z.infer<typeof ComparatorSchema>;

export const RuleConditionSchema = z.object({
  id: z.string().min(1),
  node: z.literal('condition'),
  left: RuleOperandSchema,
  comparator: ComparatorSchema,
  right: RuleOperandSchema,
});
export type RuleConditionDto = z.infer<typeof RuleConditionSchema>;

export const CombinatorSchema = z.enum(['all', 'any']);
export type CombinatorDto = z.infer<typeof CombinatorSchema>;

// Groups nest, so the type is declared by hand and the schema is lazy.
export interface RuleGroupDto {
  id: string;
  node: 'group';
  combinator: CombinatorDto;
  children: RuleNodeDto[];
}
export type RuleNodeDto = RuleConditionDto | RuleGroupDto;

export const RuleGroupSchema: z.ZodType<RuleGroupDto> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    node: z.literal('group'),
    combinator: CombinatorSchema,
    children: z.array(z.union([RuleConditionSchema, RuleGroupSchema])),
  }),
);

export const StrategyScopeSchema = z.object({
  marketIds: z.array(z.string().min(1)),
  instrumentTypes: z.array(z.string().min(1)),
  instrumentIds: z.array(InstrumentIdSchema),
});
export type StrategyScopeDto = z.infer<typeof StrategyScopeSchema>;

// Exits that fire regardless of the exit rules, so a position cannot be held indefinitely.
export const ForcedExitSchema = z.object({
  maxLossPercent: z.number().nullable(),
  maxHoldingDays: z.number().int().nullable(),
  trailingStopPercent: z.number().nullable(),
});
export type ForcedExitDto = z.infer<typeof ForcedExitSchema>;

export const SizingMethodSchema = z.enum(['fixed_amount', 'percent_of_capital', 'risk_based']);
export type SizingMethodDto = z.infer<typeof SizingMethodSchema>;

export const PositionSizingSchema = z.object({
  method: SizingMethodSchema,
  value: z.number(),
  maxPositionPercent: z.number(),
});
export type PositionSizingDto = z.infer<typeof PositionSizingSchema>;

export const AllocationLimitsSchema = z.object({
  maxCapitalPercent: z.number(),
  maxConcurrentPositions: z.number().int(),
});
export type AllocationLimitsDto = z.infer<typeof AllocationLimitsSchema>;

export const HoldingPeriodSchema = z.object({
  expectedDays: z.number().int(),
  minDays: z.number().int(),
  maxDays: z.number().int(),
});
export type HoldingPeriodDto = z.infer<typeof HoldingPeriodSchema>;

export const NewsInputsSchema = z.object({
  isEnabled: z.boolean(),
  blockAroundHighImpactEvents: z.boolean(),
  blockWindowHours: z.number().int(),
  minimumSentiment: z.number().nullable(),
});
export type NewsInputsDto = z.infer<typeof NewsInputsSchema>;

export const RiskOverridesSchema = z.object({
  maxDailyLossPercent: z.number().nullable(),
  maxLeverage: z.number().nullable(),
});
export type RiskOverridesDto = z.infer<typeof RiskOverridesSchema>;

export const StrategyDraftSchema = z.object({
  strategyId: StrategyIdSchema,
  name: z.string(),
  description: z.string(),
  version: z.string().min(1),
  stage: StrategyStageSchema,
  timeframe: z.string().min(1),
  scope: StrategyScopeSchema,
  entry: RuleGroupSchema,
  exit: RuleGroupSchema,
  forcedExit: ForcedExitSchema,
  sizing: PositionSizingSchema,
  allocation: AllocationLimitsSchema,
  holdingPeriod: HoldingPeriodSchema,
  news: NewsInputsSchema,
  risk: RiskOverridesSchema,
  updatedAt: IsoUtcTimestampSchema,
});
export type StrategyDraftDto = z.infer<typeof StrategyDraftSchema>;

// A saved version, kept so the editor can compare and revert (UI spec 7.8).
export const StrategyVersionSchema = z.object({
  version: z.string().min(1),
  savedAt: IsoUtcTimestampSchema,
  summary: z.string().min(1),
  draft: StrategyDraftSchema,
});
export type StrategyVersionDto = z.infer<typeof StrategyVersionSchema>;

export const StrategyVersionListSchema = z.array(StrategyVersionSchema);
