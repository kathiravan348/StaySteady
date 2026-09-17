// Decision journal (requirements 29; UI spec 19.1): the owner's own decisions with the reason given at
// the time, the outcome once it is known, and patterns in that behaviour reported without judgement.

import { z } from 'zod';

import { IsoUtcTimestampSchema, MoneySchema } from './common';

export const JournalEntryKindSchema = z.enum([
  'manual_trade',
  'limit_override',
  'approval_decision',
]);
export type JournalEntryKindDto = z.infer<typeof JournalEntryKindSchema>;

export const JournalOutcomeSchema = z.object({
  status: z.enum(['known', 'pending', 'not_measured']),
  summary: z.string().min(1),
  // Price change over the window after the decision, or so far while pending.
  changePercent: z.number().nullable(),
  // Whether the price then moved the way the decision assumed; null until known or not measurable.
  verdict: z.enum(['with', 'against']).nullable(),
  windowDays: z.number().int().positive(),
});
export type JournalOutcomeDto = z.infer<typeof JournalOutcomeSchema>;

export const JournalEntrySchema = z.object({
  id: z.string().min(1),
  at: IsoUtcTimestampSchema,
  kind: JournalEntryKindSchema,
  title: z.string().min(1),
  // Null when no reason was given.
  reason: z.string().nullable(),
  instrumentId: z.string().nullable(),
  symbol: z.string().nullable(),
  strategyName: z.string().nullable(),
  side: z.enum(['buy', 'sell']).nullable(),
  quantity: z.string().nullable(),
  price: MoneySchema.nullable(),
  limitName: z.string().nullable(),
  override: z.boolean(),
  outcome: JournalOutcomeSchema,
  context: z.object({
    // Portfolio change over the seven days before the decision.
    portfolioChange7dPercent: z.number().nullable(),
    afterLoss: z.boolean(),
    againstTargets: z.boolean(),
  }),
  review: z.object({ note: z.string().min(1), at: IsoUtcTimestampSchema }).nullable(),
});
export type JournalEntryDto = z.infer<typeof JournalEntrySchema>;

export const JournalPatternSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['override_repetition', 'post_loss_clustering', 'target_drift']),
  title: z.string().min(1),
  detail: z.string().min(1),
  entryIds: z.array(z.string().min(1)),
});
export type JournalPatternDto = z.infer<typeof JournalPatternSchema>;

export const JournalSchema = z.object({
  asOf: IsoUtcTimestampSchema,
  entries: z.array(JournalEntrySchema),
  patterns: z.array(JournalPatternSchema),
});
export type JournalDto = z.infer<typeof JournalSchema>;

export const JournalReviewRequestSchema = z.object({
  note: z.string().trim().min(1, 'Write what you make of it now'),
});
