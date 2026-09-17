// Derived measures, industry medians and warning flags for one company (requirements 37).
// A ratio alone does not support a decision, so every measure travels with the company's own
// history and the median of its industry peers.

import { z } from 'zod';

import { InstrumentIdSchema, IsoDateSchema, MoneySchema } from './common';
import { StatementBasisSchema } from './financial-statements';

export const MeasureGroupSchema = z.enum([
  'valuation',
  'profitability',
  'health',
  'growth',
  'cash',
]);
export const MeasureUnitSchema = z.enum(['times', 'percent', 'number']);

export const MeasureValueSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: MeasureGroupSchema,
  unit: MeasureUnitSchema,
  value: z.number().nullable(),
  // What it was computed from, so a reader can check rather than trust.
  inputs: z.string().min(1),
  periods: z.array(z.string().min(1)),
  note: z.string().min(1).nullable(),
  // Median across the industry peer group, and how many peers it was taken over.
  industryMedian: z.number().nullable(),
  peerCount: z.number().int().nonnegative(),
  // The same measure in each earlier reported year, newest first.
  history: z.array(z.number().nullable()),
});
export type MeasureValueDto = z.infer<typeof MeasureValueSchema>;

export const FundamentalFlagSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(['warning', 'critical']),
  title: z.string().min(1),
  evidence: z.string().min(1),
});
export type FundamentalFlagDto = z.infer<typeof FundamentalFlagSchema>;

export const FundamentalMeasuresSchema = z.object({
  instrumentId: InstrumentIdSchema,
  symbol: z.string().min(1),
  basis: StatementBasisSchema,
  latestPeriod: z.string().min(1),
  // Price times shares outstanding, never a stored figure (decision 19).
  marketCap: MoneySchema.nullable(),
  sharesOutstanding: z.number().positive(),
  industryName: z.string().min(1).nullable(),
  peerSymbols: z.array(z.string().min(1)),
  measures: z.array(MeasureValueSchema),
  flags: z.array(FundamentalFlagSchema),
  asOf: IsoDateSchema,
  source: z.string().min(1),
  note: z.string().min(1),
});
export type FundamentalMeasuresDto = z.infer<typeof FundamentalMeasuresSchema>;

export const FundamentalMeasuresResponseSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    measures: FundamentalMeasuresSchema.nullable(),
    unavailableReason: z.string().min(1).nullable(),
  })
  .refine((value) => (value.measures === null) !== (value.unavailableReason === null), {
    error: 'Either the measures or the reason they are unavailable, never both or neither',
    path: ['unavailableReason'],
  });
export type FundamentalMeasuresResponseDto = z.infer<typeof FundamentalMeasuresResponseSchema>;
