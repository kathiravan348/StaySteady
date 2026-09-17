// Counterparties that hold assets on the owner's behalf (requirements 32; UI spec 19.2 and 19.4).
// Profiles link to brokers through brokerIds; the share of the traded portfolio each holds is
// derived from holdings (decision 44). institutionNames stays for a future complete-picture product.

import { z } from 'zod';

import { BrokerIdSchema, CurrencyCodeSchema, MoneySchema } from './common';

export const CounterpartyKindSchema = z.enum([
  'broker',
  'bank',
  'depository',
  'insurer',
  'employer_plan',
  'government',
]);
export type CounterpartyKindDto = z.infer<typeof CounterpartyKindSchema>;

export const CounterpartyProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: CounterpartyKindSchema,
  jurisdiction: z.string().min(2),
  brokerIds: z.array(BrokerIdSchema),
  institutionNames: z.array(z.string().min(1)),
  protectionScheme: z.string().min(1).nullable(),
  // Cover per account holder; null when there is no scheme or no fixed limit.
  protectionLimit: MoneySchema.nullable(),
  protectionNote: z.string().min(1),
});
export type CounterpartyProfileDto = z.infer<typeof CounterpartyProfileSchema>;

export const CounterpartiesSchema = z.object({
  // Share of the traded portfolio above which one counterparty counts as over-weight.
  maxSharePercent: z.number().positive().max(100),
  profiles: z.array(CounterpartyProfileSchema).min(1),
});
export type CounterpartiesDto = z.infer<typeof CounterpartiesSchema>;

export const CounterpartyExposureRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: CounterpartyKindSchema,
  jurisdiction: z.string().min(2),
  positions: z.number().int().positive(),
  value: MoneySchema,
  sharePercent: z.number().min(0).max(100),
  isOverWeight: z.boolean(),
  protectionScheme: z.string().nullable(),
  protectionLimit: MoneySchema.nullable(),
  // Value above the protection limit; null when there is no fixed limit.
  uncovered: MoneySchema.nullable(),
  protectionNote: z.string().min(1),
});
export type CounterpartyExposureRowDto = z.infer<typeof CounterpartyExposureRowSchema>;

export const CounterpartyExposureSchema = z.object({
  currency: CurrencyCodeSchema,
  portfolioValue: MoneySchema,
  maxSharePercent: z.number().positive().max(100),
  rows: z.array(CounterpartyExposureRowSchema),
});
export type CounterpartyExposureDto = z.infer<typeof CounterpartyExposureSchema>;
