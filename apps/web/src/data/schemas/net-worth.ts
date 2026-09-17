// Complete net worth (requirements 25; UI spec 19.1): assets held outside the brokers, recorded by
// hand, alongside the brokerage portfolio. Nothing here is ever traded or read by automation.

import { z } from 'zod';

import { CurrencyCodeSchema, MoneySchema } from './common';
import { ReportCurrencySchema } from './reports';

export const ManualAssetCategorySchema = z.enum([
  'retirement',
  'cash_deposit',
  'gold',
  'property',
  'insurance',
  'employer_equity',
  'liability',
]);
export type ManualAssetCategoryDto = z.infer<typeof ManualAssetCategorySchema>;

// How quickly it could become cash: today, within a month, within a year, or not for over a year.
export const LiquidityClassSchema = z.enum(['immediate', 'within_month', 'within_year', 'locked']);
export type LiquidityClassDto = z.infer<typeof LiquidityClassSchema>;

// Manual: entered when known. Periodic: from a statement on a schedule. Formula: accrues at a rate.
export const ValuationMethodSchema = z.enum(['manual', 'periodic', 'formula']);
export type ValuationMethodDto = z.infer<typeof ValuationMethodSchema>;

export const AssetClassSchema = z.enum([
  'equity',
  'fixed_income',
  'cash',
  'gold',
  'real_estate',
  'insurance',
  'digital_asset',
  'other',
]);
export type AssetClassDto = z.infer<typeof AssetClassSchema>;

const amount = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount such as 1000.00');
const date = z.iso.date({ error: 'Enter a date' });

export const ManualAssetFieldsSchema = z
  .object({
    category: ManualAssetCategorySchema,
    name: z.string().trim().min(1, 'Name the asset'),
    institution: z.string().trim().min(1, 'Say where it is held'),
    currency: CurrencyCodeSchema,
    // For a liability, the amount owed. Always entered as a positive amount.
    value: amount,
    valuedOn: date,
    method: ValuationMethodSchema,
    // Formula valuations only: simple yearly accrual on the value since it was recorded.
    annualRatePercent: z
      .number()
      .min(0, 'Cannot be negative')
      .max(30, 'Above 30% is not a rate')
      .nullable(),
    liquidity: LiquidityClassSchema,
    staleAfterDays: z
      .number()
      .int('Whole days only')
      .min(1, 'At least a day')
      .max(3650, 'At most ten years'),
    // Confirmed against a statement or valuer, not only typed in.
    verified: z.boolean(),
    maturityOn: date.nullable(),
    issuer: z.string().trim().min(1).nullable(),
    sector: z.string().trim().min(1).nullable(),
    assetClass: AssetClassSchema,
    purchaseCost: amount.nullable(),
    securedAgainstId: z.string().min(1).nullable(),
    vesting: z
      .object({
        unvestedValue: amount,
        nextVestOn: date.nullable(),
        lockInUntil: date.nullable(),
      })
      .nullable(),
  })
  .superRefine((asset, ctx) => {
    const issue = (path: string[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    if (asset.method === 'formula' && asset.annualRatePercent === null) {
      issue(['annualRatePercent'], 'A formula valuation needs a yearly rate');
    }
    if (asset.vesting !== null && asset.category !== 'employer_equity') {
      issue(['vesting'], 'Only employer equity vests');
    }
    if (asset.securedAgainstId !== null && asset.category !== 'liability') {
      issue(['securedAgainstId'], 'Only a liability is secured against an asset');
    }
  });
export type ManualAssetFieldsInput = z.input<typeof ManualAssetFieldsSchema>;

export const ManualAssetSchema = z.intersection(
  z.object({ id: z.string().min(1) }),
  ManualAssetFieldsSchema,
);
export type ManualAssetDto = z.infer<typeof ManualAssetSchema>;

export const RecordValuationRequestSchema = z.object({
  value: amount,
  valuedOn: date,
  verified: z.boolean(),
});
export type RecordValuationRequestDto = z.infer<typeof RecordValuationRequestSchema>;

export const NetWorthAssetRowSchema = z.object({
  asset: ManualAssetSchema,
  // In the asset's own currency, accrued to today for a formula valuation.
  currentValue: MoneySchema,
  // In the view currency; negative for a liability.
  valueInCurrency: MoneySchema,
  ageDays: z.number().int().nonnegative(),
  isStale: z.boolean(),
});
export type NetWorthAssetRowDto = z.infer<typeof NetWorthAssetRowSchema>;

export const ConcentrationSchema = z.object({
  kind: z.enum(['issuer', 'sector', 'asset_class']),
  name: z.string().min(1),
  value: MoneySchema,
  sharePercent: z.number(),
  limitPercent: z.number(),
  breached: z.boolean(),
});
export type ConcentrationDto = z.infer<typeof ConcentrationSchema>;

export const NetWorthViewSchema = z.object({
  currency: ReportCurrencySchema,
  asOf: date,
  totals: z.object({
    netWorth: MoneySchema,
    assets: MoneySchema,
    liabilities: MoneySchema,
    marketExposed: MoneySchema,
    nonMarket: MoneySchema,
  }),
  brokerage: z.object({ value: MoneySchema, holdings: z.number().int().nonnegative() }),
  assets: z.array(NetWorthAssetRowSchema),
  liquidity: z.array(
    z.object({ liquidity: LiquidityClassSchema, value: MoneySchema, sharePercent: z.number() }),
  ),
  concentration: z.array(ConcentrationSchema),
  // Employer equity and the salary from the same employer, as one exposure (requirements 25).
  employer: z
    .object({
      employer: z.string().min(1),
      vestedEquity: MoneySchema,
      unvestedEquity: MoneySchema,
      annualSalary: MoneySchema,
      combined: MoneySchema,
      combinedSharePercent: z.number(),
      limitPercent: z.number(),
      breached: z.boolean(),
    })
    .nullable(),
});
export type NetWorthViewDto = z.infer<typeof NetWorthViewSchema>;
