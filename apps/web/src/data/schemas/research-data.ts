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
export const WatchlistListSchema = z.array(WatchlistSchema);

// Watchlist write requests (UI spec 7.5). The mock API validates bodies with these schemas.
export const WatchlistNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'Enter a name for the watchlist' })
  .max(40, { error: 'Use 40 characters or fewer' });

export const CreateWatchlistRequestSchema = z.object({ name: WatchlistNameSchema });
export type CreateWatchlistRequest = z.input<typeof CreateWatchlistRequestSchema>;

export const UpdateWatchlistRequestSchema = z
  .object({
    name: WatchlistNameSchema.optional(),
    instrumentIds: z.array(InstrumentIdSchema).optional(),
  })
  .refine((value) => value.name !== undefined || value.instrumentIds !== undefined, {
    error: 'Nothing to update',
  });
export type UpdateWatchlistRequest = z.input<typeof UpdateWatchlistRequestSchema>;

export const MoveWatchlistItemRequestSchema = z.object({
  instrumentId: InstrumentIdSchema,
  fromWatchlistId: WatchlistIdSchema,
  toWatchlistId: WatchlistIdSchema,
});
export type MoveWatchlistItemRequest = z.input<typeof MoveWatchlistItemRequestSchema>;
