import { z } from 'zod';

import {
  CurrencyCodeSchema,
  DecimalStringSchema,
  DirectionSchema,
  InstrumentIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MarketIdSchema,
  MoneySchema,
  PercentageSchema,
  PositiveDecimalStringSchema,
  QuantitySchema,
} from './common';

// Requirements 9 — configurable instrument types.
export const InstrumentTypeSchema = z.enum([
  'intraday',
  'swing',
  'long_term',
  'mutual_fund',
  'etf',
  'ipo',
  'bond',
  'commodity',
  'currency_pair',
  'derivative',
  'digital_asset',
]);
export type InstrumentTypeDto = z.infer<typeof InstrumentTypeSchema>;

export const InstrumentStatusSchema = z.enum(['active', 'suspended', 'delisted']);
export type InstrumentStatusDto = z.infer<typeof InstrumentStatusSchema>;

export const InstrumentSchema = z.object({
  id: InstrumentIdSchema,
  symbol: z.string().min(1),
  name: z.string().min(1),
  marketId: MarketIdSchema,
  currency: CurrencyCodeSchema,
  type: InstrumentTypeSchema,
  lotSize: QuantitySchema,
  tickSize: PositiveDecimalStringSchema,
  isFractionalAllowed: z.boolean(),
  status: InstrumentStatusSchema,
});
export type InstrumentDto = z.infer<typeof InstrumentSchema>;

// change and changePercent are signed against previousClose (negative when the price fell);
// direction repeats that sign for convenience.
export const MarketQuoteSchema = z.object({
  instrumentId: InstrumentIdSchema,
  lastPrice: MoneySchema,
  change: MoneySchema,
  changePercent: PercentageSchema,
  direction: DirectionSchema,
  bid: MoneySchema,
  ask: MoneySchema,
  high: MoneySchema,
  low: MoneySchema,
  open: MoneySchema,
  previousClose: MoneySchema,
  volume: z.number().nonnegative(),
  timestamp: IsoUtcTimestampSchema,
});
export type MarketQuoteDto = z.infer<typeof MarketQuoteSchema>;

// UI spec 7.4 — extended-hours data is shown distinctly from the regular session.
export const TradingSessionKindSchema = z.enum(['pre_market', 'regular', 'post_market']);
export type TradingSessionKindDto = z.infer<typeof TradingSessionKindSchema>;

// Prices are decimal strings in the instrument's currency (decision 4). Charts convert at the edge.
export const PriceBarSchema = z.object({
  timestamp: IsoUtcTimestampSchema,
  open: DecimalStringSchema,
  high: DecimalStringSchema,
  low: DecimalStringSchema,
  close: DecimalStringSchema,
  volume: z.number().nonnegative(),
  session: TradingSessionKindSchema,
  // Requirements 12 — estimated or filled-in bars are marked so backtests can exclude them.
  isEstimated: z.boolean(),
});
export type PriceBarDto = z.infer<typeof PriceBarSchema>;

// Requirements 12 — corporate actions that adjust history or record payouts.
export const CorporateActionTypeSchema = z.enum([
  'split',
  'bonus_issue',
  'dividend',
  'merger',
  'name_change',
]);
export type CorporateActionTypeDto = z.infer<typeof CorporateActionTypeSchema>;

export const CorporateActionSchema = z.object({
  id: z.string().min(1),
  instrumentId: InstrumentIdSchema,
  type: CorporateActionTypeSchema,
  effectiveDate: IsoDateSchema,
  // e.g. "2:1" for a split or bonus issue
  ratio: z
    .string()
    .regex(/^\d+:\d+$/, { error: 'Expected a ratio such as "2:1"' })
    .optional(),
  cashAmount: MoneySchema.optional(),
  description: z.string().min(1),
});
export type CorporateActionDto = z.infer<typeof CorporateActionSchema>;
