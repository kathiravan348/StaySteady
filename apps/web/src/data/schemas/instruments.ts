import { z } from 'zod';
import {
  CurrencyCodeSchema,
  DirectionSchema,
  InstrumentIdSchema,
  IsoUtcTimestampSchema,
  MarketIdSchema,
  MoneySchema,
  PercentageSchema,
} from './common';

export const InstrumentTypeSchema = z.enum(['equity', 'etf', 'mutual_fund', 'crypto', 'custom']);
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
  lotSize: z.number().positive(),
  tickSize: z.number().positive(),
  isFractionalAllowed: z.boolean(),
  status: InstrumentStatusSchema,
});
export type InstrumentDto = z.infer<typeof InstrumentSchema>;

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

export const PriceBarSchema = z.object({
  timestamp: IsoUtcTimestampSchema,
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().nonnegative(),
});
export type PriceBarDto = z.infer<typeof PriceBarSchema>;

export const CorporateActionTypeSchema = z.enum(['split', 'dividend', 'spinoff']);
export type CorporateActionTypeDto = z.infer<typeof CorporateActionTypeSchema>;

export const CorporateActionSchema = z.object({
  id: z.string().min(1),
  instrumentId: InstrumentIdSchema,
  type: CorporateActionTypeSchema,
  effectiveDate: IsoUtcTimestampSchema,
  ratio: z.string().optional(),
  cashAmount: MoneySchema.optional(),
  description: z.string().min(1),
});
export type CorporateActionDto = z.infer<typeof CorporateActionSchema>;
