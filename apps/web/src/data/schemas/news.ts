import { z } from 'zod';

import {
  InstrumentIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MarketIdSchema,
  RatioSchema,
} from './common';

export const NewsSentimentSchema = z.enum(['bullish', 'bearish', 'neutral']);
export type NewsSentimentDto = z.infer<typeof NewsSentimentSchema>;

export const NewsImportanceSchema = z.enum(['low', 'medium', 'high']);
export type NewsImportanceDto = z.infer<typeof NewsImportanceSchema>;

// Requirements 13 — news classification.
export const NewsCategorySchema = z.enum([
  'earnings',
  'regulatory',
  'management_change',
  'macroeconomic',
  'corporate_action',
  'unconfirmed_report',
]);
export type NewsCategoryDto = z.infer<typeof NewsCategorySchema>;

export const NewsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
  url: z.url(),
  // BCP 47 language tag, e.g. "en" or "ja" (requirements 13: multiple languages)
  language: z.string().min(2),
  publishedAt: IsoUtcTimestampSchema,
  category: NewsCategorySchema,
  sentiment: NewsSentimentSchema,
  // UI spec 7.6 — sentiment must always display its confidence level
  sentimentConfidence: RatioSchema,
  importance: NewsImportanceSchema,
  relatedInstruments: z.array(InstrumentIdSchema),
  relatedMarkets: z.array(MarketIdSchema),
  // UI spec 7.6 — the same story republished by several outlets shares one group id
  duplicateGroupId: z.string().min(1).optional(),
});
export type NewsItemDto = z.infer<typeof NewsItemSchema>;

export const CalendarEventTypeSchema = z.enum([
  'earnings',
  'central_bank',
  'macro_economic',
  'split',
  'dividend',
  'holiday',
]);
export type CalendarEventTypeDto = z.infer<typeof CalendarEventTypeSchema>;

export const CalendarEventImpactSchema = z.enum(['low', 'medium', 'high']);
export type CalendarEventImpactDto = z.infer<typeof CalendarEventImpactSchema>;

export const CalendarEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  marketId: MarketIdSchema,
  date: IsoDateSchema,
  eventType: CalendarEventTypeSchema,
  impact: CalendarEventImpactSchema,
  // UI spec 7.6 — marks events inside a configured trading restriction window
  inTradingRestrictionWindow: z.boolean(),
  description: z.string().optional(),
  // UI spec 7.6 — the instrument an event concerns, so the calendar can show held instruments only.
  instrumentId: InstrumentIdSchema.optional(),
});
export type CalendarEventDto = z.infer<typeof CalendarEventSchema>;
