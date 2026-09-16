import { z } from 'zod';

import { IsoDateSchema, IsoUtcTimestampSchema, MoneySchema } from './common';
import { ServiceStatusSchema } from './system';

// UI spec 7.15 — detailed health data for the System Health screen.

export const ComponentKindSchema = z.enum([
  'collector',
  'provider',
  'broker',
  'cache',
  'database',
  'strategy-engine',
  'execution',
  'scheduler',
  'notification',
  'watchdog',
]);
export type ComponentKindDto = z.infer<typeof ComponentKindSchema>;

// One monitored component. lastSuccessAt is null when it has never succeeded since start-up.
export const ComponentHealthSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: ComponentKindSchema,
  status: ServiceStatusSchema,
  lastCheckAt: IsoUtcTimestampSchema,
  lastSuccessAt: IsoUtcTimestampSchema.nullable(),
  responseTimeMs: z.number().nonnegative().nullable(),
  issue: z.string().min(1).nullable(),
});
export type ComponentHealthDto = z.infer<typeof ComponentHealthSchema>;

// How old the newest data is for a market or provider, and how old it may be before it is late.
export const DataFreshnessSchema = z.object({
  id: z.string().min(1),
  scope: z.enum(['market', 'provider']),
  name: z.string().min(1),
  marketId: z.string().min(1).nullable(),
  newestDataAt: IsoUtcTimestampSchema,
  expectedMaxAgeSeconds: z.number().int().positive(),
});
export type DataFreshnessDto = z.infer<typeof DataFreshnessSchema>;

export const ReliabilityPeriodSchema = z.enum(['7d', '30d', '90d']);
export type ReliabilityPeriodDto = z.infer<typeof ReliabilityPeriodSchema>;

export const ReliabilityDaySchema = z.object({
  date: IsoDateSchema,
  uptimePercent: z.number().min(0).max(100),
});

// Provider and broker reliability over a period; usage and cost cover the current month.
export const SourceReliabilitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['provider', 'broker']),
  period: ReliabilityPeriodSchema,
  uptimePercent: z.number().min(0).max(100),
  days: z.array(ReliabilityDaySchema),
  failureCount: z.number().int().nonnegative(),
  failoverCount: z.number().int().nonnegative(),
  requestsUsed: z.number().int().nonnegative(),
  requestLimit: z.number().int().positive(),
  costUsed: MoneySchema,
  costBudget: MoneySchema,
});
export type SourceReliabilityDto = z.infer<typeof SourceReliabilitySchema>;

// Destinations are masked: the mock never holds real contact details or webhook secrets.
export const AlertChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['email', 'sms', 'push', 'webhook']),
  destination: z.string().min(1),
  lastTest: z
    .object({
      at: IsoUtcTimestampSchema,
      result: z.enum(['passed', 'failed']),
      detail: z.string().min(1),
    })
    .nullable(),
});
export type AlertChannelDto = z.infer<typeof AlertChannelSchema>;
export const AlertChannelListSchema = z.array(AlertChannelSchema);
