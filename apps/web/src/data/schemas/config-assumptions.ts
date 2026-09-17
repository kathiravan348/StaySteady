// Planning assumptions and operating policy (E-09; requirements 30, 32, 34; UI spec 7.18 and 19.2):
// inflation assumed per country, the monthly running-cost budget, the share of the portfolio one
// counterparty may hold, and what is exported and how often.

import { z } from 'zod';

import { CurrencyCodeSchema, IsoUtcTimestampSchema, MoneySchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema } from './config';
import { InflationCountrySchema } from './inflation';

const version = <S extends z.ZodType>(snapshot: S) =>
  z.object({
    version: z.number().int().positive(),
    savedAt: IsoUtcTimestampSchema,
    reason: z.string().min(1),
    snapshot,
  });

const amount = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount such as 100.00');

export const InflationAssumptionConfigSchema = z.object({
  country: InflationCountrySchema,
  // Used for projections, and for any past month with no recorded figure.
  assumedAnnualPercent: z
    .number()
    .min(-5, 'Below -5% is not a realistic assumption')
    .max(25, 'Above 25% is not a realistic assumption'),
  // When on, real returns over past periods use recorded inflation rather than the assumption.
  useRecordedHistory: z.boolean(),
  reviewEveryDays: z
    .number()
    .int('Whole days only')
    .min(30, 'Review at most every 30 days')
    .max(730, 'Review at least every two years'),
});
export type InflationAssumptionConfigInput = z.input<typeof InflationAssumptionConfigSchema>;

export const InflationAssumptionEntrySchema = z.object({
  config: InflationAssumptionConfigSchema,
  health: ConfigHealthSchema,
  versions: z.array(version(InflationAssumptionConfigSchema)).min(1),
});
export type InflationAssumptionEntryDto = z.infer<typeof InflationAssumptionEntrySchema>;

export const InflationAssumptionListSchema = z.array(InflationAssumptionEntrySchema);

export const SaveInflationAssumptionRequestSchema = z.object({
  config: InflationAssumptionConfigSchema,
  reason: ChangeReasonSchema,
});

export const CostCategorySchema = z.enum(['hosting', 'data', 'broker', 'backup', 'other']);
export type CostCategoryDto = z.infer<typeof CostCategorySchema>;

export const ManualCostItemSchema = z.object({
  id: z.string().regex(/^cost-[a-z0-9-]{2,30}$/),
  label: z.string().trim().min(1, 'Name the cost'),
  category: CostCategorySchema,
  monthlyAmount: amount,
});
export type ManualCostItemInput = z.input<typeof ManualCostItemSchema>;

export const ExportFormatSchema = z.enum(['csv', 'json']);
export const ExportScheduleSchema = z.enum(['off', 'weekly', 'monthly']);
export const ExportDatasetSchema = z.enum([
  'holdings',
  'lots',
  'transactions',
  'income',
  'costs',
  'configuration',
  'history',
]);
export type ExportDatasetDto = z.infer<typeof ExportDatasetSchema>;

export const OperatingPolicyConfigSchema = z
  .object({
    id: z.literal('operating-policy'),
    costBudget: z.object({
      currency: CurrencyCodeSchema,
      monthlyBudget: amount.refine((value) => /[1-9]/.test(value), 'Must be above zero'),
      // Warn once running costs reach this share of the budget.
      warnAtPercent: z
        .number()
        .int('Whole percent only')
        .min(50, 'Warn at 50% or later')
        .max(100, 'Cannot warn after the budget is spent'),
      // Yearly running cost as a share of portfolio value, in basis points.
      maxShareOfPortfolioBps: z
        .number()
        .min(1, 'At least 1 bp')
        .max(1000, 'Above 10% a year is not a useful limit'),
      // Costs not already in a data provider's configuration.
      manualItems: z.array(ManualCostItemSchema).max(20, 'At most 20 items'),
    }),
    counterpartyMaxSharePercent: z
      .number()
      .min(5, 'Below 5% would flag almost every institution')
      .max(100, 'Cannot be above 100%'),
    // Requirements 29 — friction proportional to consequence on manual decisions.
    safeguards: z.object({
      // 0 turns the cooling-off period off.
      coolingOffMinutes: z
        .number()
        .int('Whole minutes only')
        .min(0, 'Cannot be negative')
        .max(1440, 'At most a day'),
      coolingOffAbove: z.object({
        currency: CurrencyCodeSchema,
        amount: amount.refine((value) => /[1-9]/.test(value), 'Must be above zero'),
      }),
      requireStatedReason: z.boolean(),
    }),
    export: z.object({
      formats: z.array(ExportFormatSchema).min(1, 'Choose at least one format'),
      schedule: ExportScheduleSchema,
      datasets: z.array(ExportDatasetSchema).min(1, 'Choose at least one dataset'),
      // Writes a description of every field beside the data, so it is readable without this software.
      includeFieldDictionary: z.boolean(),
      // How long exported records are kept; statutory periods are commonly six to eight years.
      retentionYears: z.number().int('Whole years only').min(1, 'At least one year').max(30),
    }),
  })
  .superRefine((config, ctx) => {
    const ids = config.costBudget.manualItems.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['costBudget', 'manualItems'],
        message: 'Duplicate item',
      });
    }
  });
export type OperatingPolicyConfigInput = z.input<typeof OperatingPolicyConfigSchema>;

export const OperatingCostLineSchema = z.object({
  label: z.string().min(1),
  category: CostCategorySchema,
  source: z.enum(['provider', 'manual']),
  monthlyAmount: MoneySchema,
});

// Worked out by the server from the saved provider costs, the manual items and portfolio value.
export const OperatingCostSummarySchema = z.object({
  lines: z.array(OperatingCostLineSchema),
  monthlyTotal: MoneySchema,
  budgetUsedPercent: z.number(),
  yearlyShareOfPortfolioBps: z.number().nullable(),
});
export type OperatingCostSummaryDto = z.infer<typeof OperatingCostSummarySchema>;

export const OperatingPolicyEntrySchema = z.object({
  config: OperatingPolicyConfigSchema,
  health: ConfigHealthSchema,
  costs: OperatingCostSummarySchema,
  versions: z.array(version(OperatingPolicyConfigSchema)).min(1),
});
export type OperatingPolicyEntryDto = z.infer<typeof OperatingPolicyEntrySchema>;

export const OperatingPolicyListSchema = z.array(OperatingPolicyEntrySchema);

export const SaveOperatingPolicyRequestSchema = z.object({
  config: OperatingPolicyConfigSchema,
  reason: ChangeReasonSchema,
});
