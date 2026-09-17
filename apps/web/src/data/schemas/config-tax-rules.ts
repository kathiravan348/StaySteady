// Tax rule sets per country of residence (E-09; requirements 26; decision 45). Tax follows where the
// owner lives, not where an instrument is listed, so holding periods, rates, exemptions, cost basis
// and the tax year are set here per asset class. Market configuration keeps only what a market
// itself charges: dividend withholding and transaction taxes.

import { z } from 'zod';

import { CurrencyCodeSchema, IsoDateSchema, IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema } from './config';

const version = <S extends z.ZodType>(snapshot: S) =>
  z.object({
    version: z.number().int().positive(),
    savedAt: IsoUtcTimestampSchema,
    reason: z.string().min(1),
    snapshot,
  });

const percent = z.number().min(0, 'Cannot be negative').max(100, 'Cannot be above 100%');
const amount = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount such as 1000.00');

export const TaxAssetClassSchema = z.enum([
  'domestic_equity',
  'domestic_equity_fund',
  'foreign_equity',
  'debt',
  'gold',
  'other',
]);
export type TaxAssetClassDto = z.infer<typeof TaxAssetClassSchema>;

export const CostBasisMethodSchema = z.enum(['fifo', 'average', 'specific_lot']);
export type CostBasisMethodDto = z.infer<typeof CostBasisMethodSchema>;

export const AssetClassTaxRuleSchema = z
  .object({
    assetClass: TaxAssetClassSchema,
    // Null when the class makes no short/long distinction; every gain is taxed at the short rate.
    longTermAfterDays: z.number().int('Whole days only').positive('At least one day').nullable(),
    shortTermRatePercent: percent,
    longTermRatePercent: percent,
    // Long-term gains up to this amount a tax year are exempt; 0 when there is no exemption.
    longTermExemption: amount,
  })
  .superRefine((rule, ctx) => {
    if (rule.longTermAfterDays === null && rule.longTermRatePercent !== rule.shortTermRatePercent) {
      ctx.addIssue({
        code: 'custom',
        path: ['longTermRatePercent'],
        message: 'No holding period is set, so a separate long-term rate can never apply',
      });
    }
  });
export type AssetClassTaxRuleInput = z.input<typeof AssetClassTaxRuleSchema>;

export const CostBasisProtectionSchema = z.object({
  assetClass: TaxAssetClassSchema,
  // Assets bought before this date keep the protected cost basis.
  acquiredBefore: IsoDateSchema,
  description: z.string().trim().min(1, 'Say what the protection does'),
});

export const TaxRuleSetConfigSchema = z
  .object({
    country: z.string().regex(/^[A-Z]{2}$/, 'Use a two-letter country code, such as IN'),
    isResidence: z.boolean(),
    currency: CurrencyCodeSchema,
    taxYearStart: z.object({
      month: z.number().int().min(1, 'Month 1 to 12').max(12, 'Month 1 to 12'),
      day: z.number().int().min(1, 'Day 1 to 28').max(28, 'Use day 28 or earlier'),
    }),
    costBasisMethod: CostBasisMethodSchema,
    // Tax years a capital loss may be carried forward; null when it never expires.
    lossCarryForwardYears: z.number().int().min(0).max(50).nullable(),
    rules: z.array(AssetClassTaxRuleSchema).min(1, 'Add at least one asset class'),
    costBasisProtections: z.array(CostBasisProtectionSchema),
    foreignAssets: z.object({
      annualDisclosureRequired: z.boolean(),
      // Cap on money sent abroad in a tax year; null when there is none.
      remittanceCapPerYear: z.object({ currency: CurrencyCodeSchema, amount }).nullable(),
      foreignTaxCreditClaimable: z.boolean(),
    }),
  })
  .superRefine((config, ctx) => {
    const seen = new Set<string>();
    config.rules.forEach((rule, index) => {
      if (seen.has(rule.assetClass)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rules', index, 'assetClass'],
          message: 'This asset class already has a rule',
        });
      }
      seen.add(rule.assetClass);
    });
  });
export type TaxRuleSetConfigInput = z.input<typeof TaxRuleSetConfigSchema>;

export const TaxRuleSetEntrySchema = z.object({
  config: TaxRuleSetConfigSchema,
  health: ConfigHealthSchema,
  versions: z.array(version(TaxRuleSetConfigSchema)).min(1),
});
export type TaxRuleSetEntryDto = z.infer<typeof TaxRuleSetEntrySchema>;

export const TaxRuleSetListSchema = z.array(TaxRuleSetEntrySchema);

export const SaveTaxRuleSetRequestSchema = z.object({
  config: TaxRuleSetConfigSchema,
  reason: ChangeReasonSchema,
});
