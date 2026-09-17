// Liquidity planning (E-07; requirements 29, 30; owner question 18): an emergency reserve held apart
// from trading cash, a ladder of what could become cash and when, known commitments against it, the
// withdrawal phase, and the share of the portfolio automation may manage before it should be reduced.

import { z } from 'zod';

import { CurrencyCodeSchema, IsoDateSchema, MoneySchema } from './common';

const amount = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount such as 1000.00');

export const CommitmentSchema = z.object({
  id: z.string().regex(/^commit-[a-z0-9-]{1,30}$/),
  label: z.string().trim().min(1, 'Name the commitment'),
  dueDate: IsoDateSchema,
  amount: amount.refine((value) => /[1-9]/.test(value), 'Must be above zero'),
});
export type CommitmentInput = z.input<typeof CommitmentSchema>;

export const LiquidityPlanSchema = z
  .object({
    currency: CurrencyCodeSchema,
    reserve: z.object({
      monthlyExpenses: amount.refine((value) => /[1-9]/.test(value), 'Must be above zero'),
      targetMonths: z.number().int('Whole months').min(1, 'At least one month').max(36),
      // Held outside the trading accounts; automation never counts or uses it.
      heldAmount: amount,
      heldWhere: z.string().trim().min(1, 'Say where the reserve is kept'),
    }),
    commitments: z.array(CommitmentSchema).max(20, 'At most 20 commitments'),
    withdrawal: z.object({
      enabled: z.boolean(),
      startDate: IsoDateSchema.nullable(),
      annualAmount: amount,
    }),
    // Automation is reduced once automated positions pass this share of the portfolio.
    automationCeilingPercent: z.number().min(5, 'At least 5%').max(100, 'At most 100%'),
  })
  .superRefine((plan, ctx) => {
    if (plan.withdrawal.enabled && plan.withdrawal.startDate === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['withdrawal', 'startDate'],
        message: 'Choose when withdrawals start',
      });
    }
  });
export type LiquidityPlanInput = z.input<typeof LiquidityPlanSchema>;

export const LadderBucketSchema = z.enum(['cash', 'days', 'weeks', 'months']);
export type LadderBucketDto = z.infer<typeof LadderBucketSchema>;

export const LiquidityViewSchema = z.object({
  plan: LiquidityPlanSchema,
  reserve: z.object({
    monthsCovered: z.number().nonnegative(),
    shortfall: MoneySchema,
    status: z.enum(['funded', 'below_target']),
  }),
  ladder: z.array(
    z.object({ bucket: LadderBucketSchema, value: MoneySchema, cumulative: MoneySchema }),
  ),
  commitments: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      dueDate: IsoDateSchema,
      daysUntil: z.number().int(),
      amount: MoneySchema,
      // What could be cash by the due date, less commitments due before it.
      availableBy: MoneySchema,
      isCovered: z.boolean(),
    }),
  ),
  withdrawal: z.object({
    yearsCovered: z.number().nonnegative().nullable(),
    withdrawalRatePercent: z.number().nonnegative().nullable(),
  }),
  automation: z.object({
    automatedValue: MoneySchema,
    sharePercent: z.number().min(0).max(100),
    isAboveCeiling: z.boolean(),
  }),
});
export type LiquidityViewDto = z.infer<typeof LiquidityViewSchema>;

export const SaveLiquidityPlanSchema = z.object({ plan: LiquidityPlanSchema });
