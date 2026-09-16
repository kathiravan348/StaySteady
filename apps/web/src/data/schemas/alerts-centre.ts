// Alerts Centre (UI spec 7.19): alerts grouped by what raised them, with every occurrence, their
// acknowledgement and resolution state with notes, and escalation for unacknowledged critical alerts.

import { z } from 'zod';

import { IsoUtcTimestampSchema, SeveritySchema } from './common';
import { AlertCategorySchema } from './system';

export const AlertStateSchema = z.enum(['open', 'acknowledged', 'resolved']);
export type AlertStateDto = z.infer<typeof AlertStateSchema>;

export const AlertNoteSchema = z.object({
  at: IsoUtcTimestampSchema,
  action: z.enum(['acknowledged', 'resolved']),
  note: z.string().nullable(),
});

export const AlertEscalationSchema = z.object({
  ruleName: z.string().min(1),
  // Channels the alert went to straight away, and where it escalates.
  sentTo: z.array(z.string().min(1)),
  escalatesTo: z.array(z.string().min(1)),
  escalatesAt: IsoUtcTimestampSchema,
  hasEscalated: z.boolean(),
  // Channels whose escalation delivery failed (their last test failed).
  failedChannels: z.array(z.string().min(1)),
});
export type AlertEscalationDto = z.infer<typeof AlertEscalationSchema>;

export const AlertGroupSchema = z.object({
  id: z.string().min(1),
  severity: SeveritySchema,
  category: AlertCategorySchema,
  source: z.string().min(1),
  marketId: z.string().nullable(),
  title: z.string().min(1),
  message: z.string().min(1),
  // Newest first; a single alert has one.
  occurrences: z.array(IsoUtcTimestampSchema).min(1),
  state: AlertStateSchema,
  notes: z.array(AlertNoteSchema),
  // Present only while a critical alert is unacknowledged and a rule escalates it.
  escalation: AlertEscalationSchema.nullable(),
  // Where to go to act on it, e.g. "/trading/orders".
  link: z.object({ label: z.string().min(1), to: z.string().min(1) }).nullable(),
});
export type AlertGroupDto = z.infer<typeof AlertGroupSchema>;
export const AlertGroupListSchema = z.array(AlertGroupSchema);

export const AlertActionRequestSchema = z.object({
  action: z.enum(['acknowledge', 'resolve']),
  note: z.string().trim().max(500, 'Keep the note under 500 characters').nullable(),
});
export type AlertActionRequestDto = z.input<typeof AlertActionRequestSchema>;
