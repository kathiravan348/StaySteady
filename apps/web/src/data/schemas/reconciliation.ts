// Independent reconciliation of broker positions against the depository or registrar statement
// (E-05; requirements 31, 32; decision 45). The broker is the record of truth: a mismatch raises an
// alert and pauses automation for that account until it is resolved deliberately, with a reason.

import { z } from 'zod';

import { IsoUtcTimestampSchema } from './common';

export const ReconciliationDiscrepancySchema = z.object({
  instrumentSymbol: z.string().min(1),
  brokerQuantity: z.number().nonnegative(),
  statementQuantity: z.number().nonnegative(),
});
export type ReconciliationDiscrepancyDto = z.infer<typeof ReconciliationDiscrepancySchema>;

export const ReconciliationAccountSchema = z.object({
  brokerId: z.string().min(1),
  brokerName: z.string().min(1),
  depository: z.string().min(1),
  // Masked: only the last characters are ever shown.
  accountReference: z.string().min(1),
  method: z.string().min(1),
  lastRunAt: IsoUtcTimestampSchema.nullable(),
  positionsChecked: z.number().int().nonnegative(),
  discrepancies: z.array(ReconciliationDiscrepancySchema),
  status: z.enum(['matched', 'mismatch', 'never_run']),
  automationPaused: z.boolean(),
  // Set when the owner resolved a mismatch and resumed automation.
  resolution: z.object({ at: IsoUtcTimestampSchema, reason: z.string().min(1) }).nullable(),
});
export type ReconciliationAccountDto = z.infer<typeof ReconciliationAccountSchema>;

export const ReconciliationViewSchema = z.array(ReconciliationAccountSchema);

export const ResolveReconciliationRequestSchema = z.object({
  reason: z.string().trim().min(1, 'Say what was found and why automation can resume'),
});
