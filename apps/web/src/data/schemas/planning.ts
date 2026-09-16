// Planning (UI spec 7.17): allocation targets with drift and suggested trades, goals with projected
// completion, and scenarios (projections and proposed-trade previews). Nothing here places an order.

import { z } from 'zod';

import { IsoDateSchema, IsoUtcTimestampSchema, MoneySchema } from './common';
import { ChangeReasonSchema } from './config';
import { ReportCurrencySchema } from './reports';

export const AllocationDimensionSchema = z.enum(['type', 'country', 'currency', 'sector']);
export type AllocationDimensionDto = z.infer<typeof AllocationDimensionSchema>;

const percent = z.number().min(0, 'Cannot be negative').max(100, 'Cannot be above 100%');

export const AllocationTargetSchema = z.object({
  dimension: AllocationDimensionSchema,
  // The bucket, e.g. "long_term", "India", "USD", "Health care".
  key: z.string().min(1),
  targetPercent: percent,
});
export type AllocationTargetDto = z.infer<typeof AllocationTargetSchema>;

// Targets within a dimension must add up to 100%, or that dimension is left untargeted.
export const AllocationPlanSchema = z
  .object({
    tolerancePercent: z.number().min(0.5, 'At least 0.5 points').max(25, 'At most 25 points'),
    targets: z.array(AllocationTargetSchema),
  })
  .superRefine((plan, ctx) => {
    AllocationDimensionSchema.options.forEach((dimension) => {
      const targets = plan.targets.filter((target) => target.dimension === dimension);
      if (targets.length === 0) return;
      const keys = new Set<string>();
      targets.forEach((target) => {
        if (keys.has(target.key)) {
          ctx.addIssue({
            code: 'custom',
            path: ['targets', dimension],
            message: `${target.key} has two targets`,
          });
        }
        keys.add(target.key);
      });
      const total = targets.reduce((sum, target) => sum + target.targetPercent, 0);
      if (Math.abs(total - 100) > 0.01) {
        ctx.addIssue({
          code: 'custom',
          path: ['targets', dimension],
          message: `Targets add up to ${total.toFixed(1)}%; they must add up to 100%`,
        });
      }
    });
  });
export type AllocationPlanInput = z.input<typeof AllocationPlanSchema>;

export const SaveAllocationPlanSchema = z.object({
  plan: AllocationPlanSchema,
  reason: ChangeReasonSchema,
});

export const AllocationStatusSchema = z.enum(['within', 'over', 'under', 'untargeted']);

export const AllocationRowSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  actual: MoneySchema,
  actualPercent: z.number(),
  targetPercent: z.number().nullable(),
  // Actual minus target, in percentage points.
  driftPercent: z.number().nullable(),
  status: AllocationStatusSchema,
});
export type AllocationRowDto = z.infer<typeof AllocationRowSchema>;

export const SuggestedTradeSchema = z.object({
  id: z.string().min(1),
  dimension: AllocationDimensionSchema,
  bucket: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  // Null when nothing in the bucket is held, so there is no instrument to suggest.
  instrumentId: z.string().nullable(),
  symbol: z.string().nullable(),
  quantity: z.string().nullable(),
  value: MoneySchema,
  estimatedCost: MoneySchema,
  reason: z.string().min(1),
});
export type SuggestedTradeDto = z.infer<typeof SuggestedTradeSchema>;

export const AllocationViewSchema = z.object({
  currency: ReportCurrencySchema,
  asOf: IsoDateSchema,
  total: MoneySchema,
  plan: AllocationPlanSchema,
  savedAt: IsoUtcTimestampSchema,
  savedReason: z.string().min(1),
  dimensions: z.array(
    z.object({ dimension: AllocationDimensionSchema, rows: z.array(AllocationRowSchema) }),
  ),
  suggestions: z.array(SuggestedTradeSchema),
  notes: z.array(z.string().min(1)),
});
export type AllocationViewDto = z.infer<typeof AllocationViewSchema>;

export const GoalSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, 'A goal needs a name'),
    targetAmount: MoneySchema,
    targetDate: IsoDateSchema,
    linkedInstrumentIds: z.array(z.string().min(1)).min(1, 'Link at least one holding'),
    monthlyContribution: MoneySchema,
    // Assumed yearly return on the linked holdings, before inflation.
    expectedReturnPercent: z
      .number()
      .min(-20, 'Below -20% is not a plan')
      .max(30, 'Above 30% is not a plan'),
  })
  .superRefine((goal, ctx) => {
    if (!/[1-9]/.test(goal.targetAmount.amount) || goal.targetAmount.amount.startsWith('-')) {
      ctx.addIssue({
        code: 'custom',
        path: ['targetAmount'],
        message: 'The target must be above zero',
      });
    }
    if (goal.monthlyContribution.amount.startsWith('-')) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthlyContribution'],
        message: 'Cannot be negative',
      });
    }
    if (goal.monthlyContribution.currency !== goal.targetAmount.currency) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthlyContribution'],
        message: 'Use the same currency as the target',
      });
    }
  });
export type GoalInput = z.input<typeof GoalSchema>;

export const GoalViewSchema = z.object({
  goal: GoalSchema,
  current: MoneySchema,
  progressPercent: z.number(),
  projectedAtTarget: MoneySchema,
  // Null when the goal is not reached within 50 years on these assumptions.
  projectedCompletion: IsoDateSchema.nullable(),
  onTrack: z.boolean(),
  projection: z.array(z.object({ date: IsoDateSchema, value: z.number() })),
});
export type GoalViewDto = z.infer<typeof GoalViewSchema>;
export const GoalViewListSchema = z.array(GoalViewSchema);

export const ProjectionRequestSchema = z.object({
  currency: ReportCurrencySchema,
  monthlyContribution: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount such as 500.00'),
  years: z.number().int('Whole years only').min(1, 'At least a year').max(50, 'At most 50 years'),
  expectedReturnPercent: z.number().min(-20).max(30),
  // The spread either side of the expected return for the cautious and hopeful cases.
  spreadPercent: z.number().min(0).max(15),
  inflationPercent: z.number().min(0).max(20),
});
export type ProjectionRequestDto = z.input<typeof ProjectionRequestSchema>;

export const ProjectionSchema = z.object({
  currency: ReportCurrencySchema,
  start: MoneySchema,
  dates: z.array(IsoDateSchema),
  cases: z.array(
    z.object({
      name: z.string().min(1),
      returnPercent: z.number(),
      values: z.array(z.number()),
      final: MoneySchema,
      finalReal: MoneySchema,
    }),
  ),
  contributed: MoneySchema,
});
export type ProjectionDto = z.infer<typeof ProjectionSchema>;

export const TradePreviewRequestSchema = z.object({
  currency: ReportCurrencySchema,
  instrumentId: z.string().min(1, 'Choose an instrument'),
  side: z.enum(['buy', 'sell']),
  quantity: z.string().regex(/^\d+(\.\d{1,8})?$/, 'Enter a quantity such as 10'),
});
export type TradePreviewRequestDto = z.input<typeof TradePreviewRequestSchema>;

export const TradePreviewSchema = z.object({
  currency: ReportCurrencySchema,
  symbol: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  quantity: z.string().min(1),
  price: MoneySchema,
  value: MoneySchema,
  estimatedCost: MoneySchema,
  costBreakdown: z.array(z.object({ label: z.string().min(1), amount: MoneySchema })),
  before: z.array(
    z.object({ dimension: AllocationDimensionSchema, rows: z.array(AllocationRowSchema) }),
  ),
  after: z.array(
    z.object({ dimension: AllocationDimensionSchema, rows: z.array(AllocationRowSchema) }),
  ),
  warnings: z.array(z.string().min(1)),
});
export type TradePreviewDto = z.infer<typeof TradePreviewSchema>;
