// Counterparties that hold assets on the owner's behalf (requirements 32; UI spec 19.2 and 19.4).
// Profiles only: the share of net worth each holds is derived from holdings and the manual asset
// register, linked through brokerIds and institutionNames.

import { z } from 'zod';

import { BrokerIdSchema, MoneySchema } from './common';

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
  // Share of total net worth above which one counterparty counts as over-weight.
  maxSharePercent: z.number().positive().max(100),
  profiles: z.array(CounterpartyProfileSchema).min(1),
});
export type CounterpartiesDto = z.infer<typeof CounterpartiesSchema>;
