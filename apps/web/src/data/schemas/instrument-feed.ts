// Everything known to affect one instrument, on its research record (requirements 38; UI spec
// 20.1). News reaching it through its parent, group or peer group is kept, and marked as indirect:
// a group event is still the owner's risk, and a sector-wide move is not a company event.

import { z } from 'zod';

import { CalendarEventSchema, NewsItemSchema } from './news';
import { CorporateActionSchema } from './instruments';
import { InstrumentIdSchema, IsoDateSchema, IsoUtcTimestampSchema } from './common';

// direct: names this instrument. group: names its parent, a group company or the group itself.
// peer: names its industry or another company in it.
export const FeedReachSchema = z.enum(['direct', 'group', 'peer']);
export type FeedReach = z.infer<typeof FeedReachSchema>;

export const InstrumentNewsEntrySchema = z.object({
  item: NewsItemSchema,
  reach: FeedReachSchema,
  // What carried it here when indirect, e.g. "Tata Sons Private Limited" or "Automobiles".
  via: z.string().min(1).nullable(),
});
export type InstrumentNewsEntryDto = z.infer<typeof InstrumentNewsEntrySchema>;

export const FilingKindSchema = z.enum([
  'results',
  'shareholding',
  'board_meeting',
  'auditor_change',
  'rating_change',
  'management_change',
  'announcement',
]);
export type FilingKind = z.infer<typeof FilingKindSchema>;

export const FilingSchema = z.object({
  id: z.string().min(1),
  filedAt: IsoUtcTimestampSchema,
  kind: FilingKindSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  // Exchange or regulator that received it.
  filedWith: z.string().min(1),
});
export type FilingDto = z.infer<typeof FilingSchema>;

// An announced action is not yet a fact on the register: the record date can move or the action
// can be withdrawn, so it is held apart from effective actions and never feeds income or holdings.
export const AnnouncedActionSchema = z.object({
  id: z.string().min(1),
  type: CorporateActionSchema.shape.type,
  announcedOn: IsoDateSchema,
  expectedEffectiveDate: IsoDateSchema,
  description: z.string().min(1),
  isConfirmed: z.boolean(),
});
export type AnnouncedActionDto = z.infer<typeof AnnouncedActionSchema>;

export const RestrictionWindowSchema = z.object({
  name: z.string().min(1),
  startDate: IsoUtcTimestampSchema,
  endDate: IsoUtcTimestampSchema,
  isActive: z.boolean(),
});
export type RestrictionWindowDto = z.infer<typeof RestrictionWindowSchema>;

export const InstrumentFeedSchema = z.object({
  instrumentId: InstrumentIdSchema,
  // Newest first.
  news: z.array(InstrumentNewsEntrySchema),
  filings: z.array(FilingSchema),
  effectiveActions: z.array(CorporateActionSchema),
  announcedActions: z.array(AnnouncedActionSchema),
  // Scheduled for this instrument from today on, soonest first.
  upcomingEvents: z.array(CalendarEventSchema),
  // The restriction window in force now, or the next one to begin; null when none applies.
  nextRestrictionWindow: RestrictionWindowSchema.nullable(),
  asOf: IsoDateSchema,
  source: z.string().min(1),
});
export type InstrumentFeedDto = z.infer<typeof InstrumentFeedSchema>;
