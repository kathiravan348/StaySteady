import { z } from 'zod';
import { InstrumentIdSchema, IsoDateSchema, IsoUtcTimestampSchema, MarketIdSchema } from './common';

export const NewsSentimentSchema = z.enum(['bullish', 'bearish', 'neutral']);
export type NewsSentimentDto = z.infer<typeof NewsSentimentSchema>;

export const NewsImportanceSchema = z.enum(['low', 'medium', 'high']);
export type NewsImportanceDto = z.infer<typeof NewsImportanceSchema>;

export const NewsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
  url: z.string().url(),
  publishedAt: IsoUtcTimestampSchema,
  sentiment: NewsSentimentSchema,
  importance: NewsImportanceSchema,
  relatedInstruments: z.array(InstrumentIdSchema),
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
  description: z.string().optional(),
});
export type CalendarEventDto = z.infer<typeof CalendarEventSchema>;
