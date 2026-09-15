import { z } from 'zod';
import type { CurrencyCode } from '../../shared/types/currency';
import {
  type IsoDate,
  type IsoUtcTimestamp,
  toIsoDate,
  toIsoUtcTimestamp,
} from '../../shared/types/dateTime';
import {
  type InstrumentId,
  type MarketId,
  type OrderId,
  type StrategyId,
  toInstrumentId,
  toMarketId,
  toOrderId,
  toStrategyId,
} from '../../shared/types/identifiers';
import {
  type BasisPoints,
  type Percentage,
  type Quantity,
  toBasisPoints,
  toPercentage,
  toQuantity,
} from '../../shared/types/quantities';

export const CurrencyCodeSchema = z.enum([
  'USD',
  'INR',
  'GBP',
  'EUR',
  'JPY',
  'SGD',
]) as z.ZodType<CurrencyCode>;

export const MoneySchema = z.object({
  amount: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid decimal amount format'),
  currency: CurrencyCodeSchema,
});
export type MoneyDto = z.infer<typeof MoneySchema>;

export const IsoUtcTimestampSchema = z
  .string()
  .datetime({ offset: true, message: 'Invalid ISO UTC timestamp' })
  .transform((val): IsoUtcTimestamp => toIsoUtcTimestamp(val));

export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid ISO date (YYYY-MM-DD)')
  .transform((val): IsoDate => toIsoDate(val));

export const QuantitySchema = z
  .number()
  .finite('Quantity must be finite')
  .transform((val): Quantity => toQuantity(val));

export const PercentageSchema = z
  .number()
  .finite('Percentage must be finite')
  .transform((val): Percentage => toPercentage(val));

export const BasisPointsSchema = z
  .number()
  .int('Basis points must be an integer')
  .transform((val): BasisPoints => toBasisPoints(val));

export const InstrumentIdSchema = z
  .string()
  .min(1)
  .transform((val): InstrumentId => toInstrumentId(val));

export const MarketIdSchema = z
  .string()
  .min(1)
  .transform((val): MarketId => toMarketId(val));

export const StrategyIdSchema = z
  .string()
  .min(1)
  .transform((val): StrategyId => toStrategyId(val));

export const OrderIdSchema = z
  .string()
  .min(1)
  .transform((val): OrderId => toOrderId(val));

export const DirectionSchema = z.enum(['positive', 'negative', 'neutral']);
export type DirectionDto = z.infer<typeof DirectionSchema>;
