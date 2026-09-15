import { z } from 'zod';

import {
  InstrumentIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  WatchlistIdSchema,
} from './common';

// UI spec 7.4 right panel — key fundamentals where relevant to the instrument type. Fields that do
// not apply to a type (a P/E ratio for a commodity) are null, and `note` says why.
export const InstrumentFundamentalsSchema = z.object({
  instrumentId: InstrumentIdSchema,
  sector: z.string().min(1).nullable(),
  marketCap: MoneySchema.nullable(),
  priceToEarnings: z.number().positive().nullable(),
  dividendYieldPercent: z.number().nonnegative().nullable(),
  beta: z.number().nullable(),
  expenseRatioPercent: z.number().nonnegative().nullable(),
  couponPercent: z.number().nonnegative().nullable(),
  maturityDate: IsoDateSchema.nullable(),
  note: z.string().min(1),
});
export type InstrumentFundamentalsDto = z.infer<typeof InstrumentFundamentalsSchema>;

// UI spec 7.5 — named watchlists mixing countries and instrument types, in display order.
export const WatchlistSchema = z.object({
  id: WatchlistIdSchema,
  name: z.string().min(1),
  instrumentIds: z.array(InstrumentIdSchema),
  createdAt: IsoUtcTimestampSchema,
});
export type WatchlistDto = z.infer<typeof WatchlistSchema>;
