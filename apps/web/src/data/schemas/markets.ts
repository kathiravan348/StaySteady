// Requirements 6 — country and market configuration. Session fields match
// shared/marketTime MarketSchedule so mock data can reuse SUPPORTED_MARKET_SCHEDULES.

import { z } from 'zod';

import {
  CurrencyCodeSchema,
  GainLossConventionSchema,
  IanaTimeZoneSchema,
  IsoDateSchema,
  MarketIdSchema,
  TimeOfDaySchema,
} from './common';
import { InstrumentTypeSchema } from './instruments';

export const TradingSessionSchema = z.object({
  start: TimeOfDaySchema,
  end: TimeOfDaySchema,
});
export type TradingSessionDto = z.infer<typeof TradingSessionSchema>;

export const WeekdaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
export type WeekdayDto = z.infer<typeof WeekdaySchema>;

export const MarketHolidaySchema = z.object({
  date: IsoDateSchema,
  name: z.string().min(1),
  isHalfDay: z.boolean(),
});
export type MarketHolidayDto = z.infer<typeof MarketHolidaySchema>;

export const MarketSchema = z.object({
  marketId: MarketIdSchema,
  name: z.string().min(1),
  country: z.string().min(1),
  exchangeName: z.string().min(1),
  currency: CurrencyCodeSchema,
  timezone: IanaTimeZoneSchema,
  preMarket: TradingSessionSchema.optional(),
  regularHours: z.array(TradingSessionSchema).min(1),
  postMarket: TradingSessionSchema.optional(),
  weekendDays: z.array(WeekdaySchema),
  holidays: z.array(MarketHolidaySchema),
  settlementDays: z.number().int().nonnegative(),
  // Requirements 6 — days a holding must be held for long-term tax treatment; null when the market
  // makes no holding-period distinction.
  holdingPeriodTaxThresholdDays: z.number().int().positive().nullable(),
  permittedInstrumentTypes: z.array(InstrumentTypeSchema).min(1),
  // Requirements 5 — nothing trades automatically unless this is true
  automationPermitted: z.boolean(),
  // UI spec 11 — gain/loss colour convention is configurable per market
  gainLossConvention: GainLossConventionSchema,
});
export type MarketDto = z.infer<typeof MarketSchema>;
