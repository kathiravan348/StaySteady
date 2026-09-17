// Country and market configuration (UI spec 7.18). The cross-field rules live in the schema, so the
// form's inline validation and the server's save validation are the same check.

import { z } from 'zod';

import { CurrencyCodeSchema, IanaTimeZoneSchema, IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema, ConfigModeSchema } from './config';
import { InstrumentTypeSchema } from './instruments';
import { MarketHolidaySchema, TradingSessionSchema, WeekdaySchema } from './markets';

export const MarketFeesSchema = z.object({
  commissionBps: z.number().min(0, 'Cannot be negative').max(500, 'Above 500 bps is not a fee'),
  minimumCommission: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Enter an amount such as 1.00'),
  exchangeFeeBps: z.number().min(0, 'Cannot be negative').max(100, 'Above 100 bps is not a fee'),
  // Stamp duty or securities transaction tax, charged on top of commission.
  transactionTaxBps: z.number().min(0, 'Cannot be negative').max(500, 'Above 500 bps is not a tax'),
});
export type MarketFeesDto = z.infer<typeof MarketFeesSchema>;

const percent = z.number().min(0, 'Cannot be negative').max(100, 'Cannot be above 100%');

// Tax the market itself takes at source. Gains tax follows the residence rule set (decision 45).
export const MarketTaxRulesSchema = z.object({
  dividendWithholdingPercent: percent,
});
export type MarketTaxRulesDto = z.infer<typeof MarketTaxRulesSchema>;

type Session = z.input<typeof TradingSessionSchema>;
const minutesOf = (time: Session['start']): number => time.hour * 60 + time.minute;

export const MarketConfigSchema = z
  .object({
    marketId: z.string().regex(/^[A-Z]{2,4}$/, 'Use a 2 to 4 letter uppercase code, such as US'),
    name: z.string().trim().min(1, 'A market needs a name'),
    country: z.string().trim().min(1, 'Say which country this market is in'),
    exchangeName: z.string().trim().min(1, 'Name the exchange'),
    currency: CurrencyCodeSchema,
    timezone: IanaTimeZoneSchema,
    regularHours: z.array(TradingSessionSchema).min(1, 'At least one trading session is needed'),
    preMarket: TradingSessionSchema.nullable(),
    postMarket: TradingSessionSchema.nullable(),
    weekendDays: z.array(WeekdaySchema),
    holidays: z.array(MarketHolidaySchema),
    settlementDays: z
      .number()
      .int('Whole days only')
      .min(0, 'Cannot be negative')
      .max(10, 'Above 10 days is not a settlement cycle'),
    fees: MarketFeesSchema,
    tax: MarketTaxRulesSchema,
    permittedInstrumentTypes: z
      .array(InstrumentTypeSchema)
      .min(1, 'Permit at least one instrument type'),
    automationPermitted: z.boolean(),
    enabled: z.boolean(),
    mode: ConfigModeSchema,
  })
  .superRefine((config, ctx) => {
    const issue = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };

    config.regularHours.forEach((session, index) => {
      if (minutesOf(session.end) <= minutesOf(session.start)) {
        issue(['regularHours', index, 'end'], 'A session must end after it starts');
      }
      const previous = config.regularHours[index - 1];
      if (previous !== undefined && minutesOf(session.start) < minutesOf(previous.end)) {
        issue(['regularHours', index, 'start'], 'Starts before the previous session ends');
      }
    });

    const first = config.regularHours[0];
    const last = config.regularHours[config.regularHours.length - 1];
    if (config.preMarket !== null) {
      if (minutesOf(config.preMarket.end) <= minutesOf(config.preMarket.start)) {
        issue(['preMarket', 'end'], 'Pre-market must end after it starts');
      } else if (first !== undefined && minutesOf(config.preMarket.end) > minutesOf(first.start)) {
        issue(['preMarket', 'end'], 'Pre-market must end by the time regular trading opens');
      }
    }
    if (config.postMarket !== null) {
      if (minutesOf(config.postMarket.end) <= minutesOf(config.postMarket.start)) {
        issue(['postMarket', 'end'], 'Post-market must end after it starts');
      } else if (last !== undefined && minutesOf(config.postMarket.start) < minutesOf(last.end)) {
        issue(['postMarket', 'start'], 'Post-market cannot start before regular trading closes');
      }
    }

    if (new Set(config.weekendDays).size >= 7) {
      issue(['weekendDays'], 'A market needs at least one trading day');
    }

    // A holiday on a weekend day is allowed: exchange calendars list national holidays that fall on
    // weekends. The form points it out, but it is not an error.
    const seen = new Set<string>();
    config.holidays.forEach((holiday, index) => {
      if (seen.has(holiday.date)) {
        issue(['holidays', index, 'date'], 'This date is already in the calendar');
      }
      seen.add(holiday.date);
    });
  });
export type MarketConfigDto = z.infer<typeof MarketConfigSchema>;
export type MarketConfigInput = z.input<typeof MarketConfigSchema>;

export const MarketConfigVersionSchema = z.object({
  version: z.number().int().positive(),
  savedAt: IsoUtcTimestampSchema,
  reason: z.string().min(1),
  snapshot: MarketConfigSchema,
});
export type MarketConfigVersionDto = z.infer<typeof MarketConfigVersionSchema>;

export const MarketConfigEntrySchema = z.object({
  config: MarketConfigSchema,
  health: ConfigHealthSchema,
  // Newest first; the first is what is in force.
  versions: z.array(MarketConfigVersionSchema).min(1),
});
export type MarketConfigEntryDto = z.infer<typeof MarketConfigEntrySchema>;

export const MarketConfigListSchema = z.array(MarketConfigEntrySchema);

export const SaveMarketConfigRequestSchema = z.object({
  config: MarketConfigSchema,
  reason: ChangeReasonSchema,
});
export type SaveMarketConfigRequestDto = z.input<typeof SaveMarketConfigRequestSchema>;
