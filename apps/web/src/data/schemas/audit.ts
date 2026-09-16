// Audit log (UI spec 7.20): every change and decision with what changed, when, what triggered it and
// why, linked to its decision chain where it belongs to an order.

import { z } from 'zod';

import { IsoUtcTimestampSchema } from './common';

export const AuditCategorySchema = z.enum([
  'configuration',
  'approval',
  'order',
  'signal',
  'risk_limit',
  'emergency',
  'strategy_stage',
  'strategy_definition',
]);
export type AuditCategoryDto = z.infer<typeof AuditCategorySchema>;

// Who or what caused the entry.
export const AuditTriggerSchema = z.enum(['owner', 'strategy', 'system', 'broker']);
export type AuditTriggerDto = z.infer<typeof AuditTriggerSchema>;

export const AuditChangeSchema = z.object({
  field: z.string().min(1),
  before: z.string().nullable(),
  after: z.string().nullable(),
});
export type AuditChangeDto = z.infer<typeof AuditChangeSchema>;

export const AuditEntrySchema = z.object({
  id: z.string().min(1),
  at: IsoUtcTimestampSchema,
  category: AuditCategorySchema,
  trigger: AuditTriggerSchema,
  title: z.string().min(1),
  // What the entry is about, e.g. "Market US" or "Order ord-0001 (SPY)".
  subject: z.string().min(1),
  changes: z.array(AuditChangeSchema),
  reason: z.string().nullable(),
  // The order whose decision chain this entry belongs to.
  orderId: z.string().nullable(),
});
export type AuditEntryDto = z.infer<typeof AuditEntrySchema>;
export const AuditEntryListSchema = z.array(AuditEntrySchema);
