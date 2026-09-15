// Shared primitive schemas (standards 6.3 and 6.4). Transforms only run on input that has already
// passed validation, so safeParse always returns issues and never throws.

import { z } from 'zod';

import { SUPPORTED_CURRENCIES } from '../../shared/types/currency';
import type { IsoDate, IsoUtcTimestamp } from '../../shared/types/dateTime';
import { SUPPORTED_TIMEZONES, toIsoDate, toIsoUtcTimestamp } from '../../shared/types/dateTime';
import type {
  AlertId,
  BacktestId,
  BrokerId,
  IncidentId,
  InstrumentId,
  MarketId,
  OrderId,
  StrategyId,
  WatchlistId,
} from '../../shared/types/identifiers';
import {
  toAlertId,
  toBacktestId,
  toBrokerId,
  toIncidentId,
  toInstrumentId,
  toMarketId,
  toOrderId,
  toStrategyId,
  toWatchlistId,
} from '../../shared/types/identifiers';
import type { BasisPoints, Percentage, Quantity, Ratio } from '../../shared/types/quantities';
import { toBasisPoints, toPercentage, toQuantity, toRatio } from '../../shared/types/quantities';

// Derived from the shared list so the schema and the CurrencyCode type cannot drift apart.
export const CurrencyCodeSchema = z.enum(SUPPORTED_CURRENCIES);

// Money and prices travel as decimal strings, never plain numbers (decision 4).
export const DecimalStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, { error: 'Expected a decimal string such as "1234.50"' });

export const PositiveDecimalStringSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, { error: 'Expected a positive decimal string' })
  .refine((value) => /[1-9]/.test(value), { error: 'Expected a value greater than zero' });

export const MoneySchema = z.object({
  amount: DecimalStringSchema,
  currency: CurrencyCodeSchema,
});
export type MoneyDto = z.infer<typeof MoneySchema>;

// Any offset is accepted and normalised to UTC; a timestamp without a zone is rejected.
export const IsoUtcTimestampSchema = z.iso
  .datetime({ offset: true, error: 'Expected an ISO 8601 timestamp with a time zone' })
  .transform((value): IsoUtcTimestamp => toIsoUtcTimestamp(value));

export const IsoDateSchema = z.iso
  .date({ error: 'Expected a calendar date (YYYY-MM-DD)' })
  .transform((value): IsoDate => toIsoDate(value));

export const TimeOfDaySchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export const IanaTimeZoneSchema = z.enum(SUPPORTED_TIMEZONES);

export const QuantitySchema = z.number().transform((value): Quantity => toQuantity(value));

export const PercentageSchema = z.number().transform((value): Percentage => toPercentage(value));

export const RatioSchema = z
  .number()
  .min(0)
  .max(1)
  .transform((value): Ratio => toRatio(value));

export const BasisPointsSchema = z
  .number()
  .int({ error: 'Basis points must be an integer' })
  .transform((value): BasisPoints => toBasisPoints(value));

// Trims before the length check, so a whitespace-only id fails validation instead of throwing.
function idSchema<T>(
  toId: (value: string) => T,
): z.ZodPipe<z.ZodString, z.ZodTransform<T, string>> {
  return z
    .string()
    .trim()
    .min(1, { error: 'Expected a non-empty id' })
    .transform((value): T => toId(value));
}

export const InstrumentIdSchema = idSchema<InstrumentId>(toInstrumentId);
export const MarketIdSchema = idSchema<MarketId>(toMarketId);
export const StrategyIdSchema = idSchema<StrategyId>(toStrategyId);
export const OrderIdSchema = idSchema<OrderId>(toOrderId);
export const BrokerIdSchema = idSchema<BrokerId>(toBrokerId);
export const AlertIdSchema = idSchema<AlertId>(toAlertId);
export const IncidentIdSchema = idSchema<IncidentId>(toIncidentId);
export const BacktestIdSchema = idSchema<BacktestId>(toBacktestId);
export const WatchlistIdSchema = idSchema<WatchlistId>(toWatchlistId);

export const DirectionSchema = z.enum(['positive', 'negative', 'neutral']);
export type DirectionDto = z.infer<typeof DirectionSchema>;

// Requirements 11 — severity tiers shared by alerts and incidents.
export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type SeverityDto = z.infer<typeof SeveritySchema>;

// UI spec 4 and 11 — gain/loss colour convention; values match the display settings axis.
export const GainLossConventionSchema = z.enum(['green-up', 'red-up']);
export type GainLossConventionDto = z.infer<typeof GainLossConventionSchema>;
