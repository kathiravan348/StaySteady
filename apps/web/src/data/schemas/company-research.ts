// The company behind an instrument (requirements 35). What the business is, where its revenue comes
// from, who runs it and who audits it — the part of a decision that is not a number.

import { z } from 'zod';

import { CurrencyCodeSchema, InstrumentIdSchema, IsoDateSchema, PercentageSchema } from './common';

// A reported split of revenue, by business segment or by geography. Shares are of total revenue and
// may not add to 100 when a company reports an "other" line it does not break down.
export const RevenueSplitEntrySchema = z.object({
  name: z.string().min(1),
  sharePercent: PercentageSchema,
});
export type RevenueSplitEntryDto = z.infer<typeof RevenueSplitEntrySchema>;

export const CompanyRoleSchema = z.enum(['chief_executive', 'chair', 'chief_financial_officer']);
export type CompanyRole = z.infer<typeof CompanyRoleSchema>;

export const KeyPersonSchema = z.object({
  role: CompanyRoleSchema,
  name: z.string().min(1),
  inRoleSince: z.number().int().min(1900).max(2100).nullable(),
  // A change in the last twelve months is a risk flag, not a biography detail.
  appointedInLastYear: z.boolean(),
});
export type KeyPersonDto = z.infer<typeof KeyPersonSchema>;

export const AuditorSchema = z.object({
  name: z.string().min(1),
  lastOpinionDate: IsoDateSchema,
  // A qualified opinion is the single most important thing on this record when it happens.
  isQualified: z.boolean(),
  note: z.string().min(1).nullable(),
});
export type AuditorDto = z.infer<typeof AuditorSchema>;

export const CompanyIdentifiersSchema = z.object({
  isin: z.string().min(1).nullable(),
  localCode: z.string().min(1).nullable(),
});

export const CompanyProfileSchema = z.object({
  instrumentId: InstrumentIdSchema,
  symbol: z.string().min(1),
  legalName: z.string().min(1),
  // Plain description of what the business does, not a marketing summary (requirements 35).
  description: z.string().min(40),
  incorporationCountry: z.string().min(1),
  primaryListing: z.string().min(1),
  secondaryListings: z.array(z.string().min(1)),
  listedSince: IsoDateSchema.nullable(),
  headquarters: z.string().min(1),
  website: z.string().min(1).nullable(),
  employeeCount: z.number().int().positive().nullable(),
  reportingCurrency: CurrencyCodeSchema,
  // Month and day the financial year ends, as MM-DD: India runs to 31 March, most of the US to
  // 31 December, Apple to late September. Every statement date has to be read against it.
  fiscalYearEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/, { error: 'Expected a fiscal year end as MM-DD' }),
  identifiers: CompanyIdentifiersSchema,
  revenueBySegment: z.array(RevenueSplitEntrySchema),
  revenueByGeography: z.array(RevenueSplitEntrySchema),
  people: z.array(KeyPersonSchema),
  auditor: AuditorSchema.nullable(),
  // What the business depends on: a few customers, a supplier, one product line.
  dependencies: z.array(z.string().min(1)),
  asOf: IsoDateSchema,
  source: z.string().min(1),
  note: z.string().min(1),
});
export type CompanyProfileDto = z.infer<typeof CompanyProfileSchema>;

// An instrument with no company behind it, or a company no provider has covered yet, answers with
// the reason. Partial provider coverage is the normal state, not a failure (UI spec 20.3).
export const CompanyProfileResponseSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    profile: CompanyProfileSchema.nullable(),
    unavailableReason: z.string().min(1).nullable(),
  })
  .refine((value) => (value.profile === null) !== (value.unavailableReason === null), {
    error: 'Either the profile or the reason it is unavailable, never both or neither',
    path: ['unavailableReason'],
  });
export type CompanyProfileResponseDto = z.infer<typeof CompanyProfileResponseSchema>;
