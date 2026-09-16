// Currency configuration (UI spec 7.18): the base currency, where each currency's exchange rate comes
// from, and the conversion cost assumed when money is converted into it.

import { z } from 'zod';

import { CurrencyCodeSchema, IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema } from './config';
import { BASE_CURRENCIES } from '../../shared/types/currency';

const providerId = z.string().regex(/^prov-[a-z0-9-]{2,30}$/, 'Choose a data provider');

export const CurrencyConfigSchema = z
  .object({
    currency: CurrencyCodeSchema,
    enabled: z.boolean(),
    rateSourceId: providerId,
    // Used when the rate source fails; null means rates simply go stale.
    fallbackSourceId: providerId.nullable(),
    // A rate older than this is stale and conversions using it are flagged.
    maxRateAgeMinutes: z
      .number()
      .int('Whole minutes only')
      .min(1, 'At least one minute')
      .max(10_080, 'At most a week'),
    // Charged on conversions into this currency, as a spread plus fee.
    conversionCostBps: z
      .number()
      .min(0, 'Cannot be negative')
      .max(500, 'Above 500 bps is not a cost'),
  })
  .superRefine((config, ctx) => {
    if (config.fallbackSourceId !== null && config.fallbackSourceId === config.rateSourceId) {
      ctx.addIssue({
        code: 'custom',
        path: ['fallbackSourceId'],
        message: 'The fallback must be a different source from the main one',
      });
    }
  });
export type CurrencyConfigDto = z.infer<typeof CurrencyConfigSchema>;
export type CurrencyConfigInput = z.input<typeof CurrencyConfigSchema>;

const version = <S extends z.ZodType>(snapshot: S) =>
  z.object({
    version: z.number().int().positive(),
    savedAt: IsoUtcTimestampSchema,
    reason: z.string().min(1),
    snapshot,
  });

export const CurrencyConfigEntrySchema = z.object({
  config: CurrencyConfigSchema,
  health: ConfigHealthSchema,
  versions: z.array(version(CurrencyConfigSchema)).min(1),
});
export type CurrencyConfigEntryDto = z.infer<typeof CurrencyConfigEntrySchema>;

export const CurrencyConfigListSchema = z.array(CurrencyConfigEntrySchema);

export const SaveCurrencyConfigRequestSchema = z.object({
  config: CurrencyConfigSchema,
  reason: ChangeReasonSchema,
});

// The currency reports and totals are expressed in. Versioned on its own, since it is one choice
// across all currencies rather than a property of any one of them.
export const BaseCurrencyConfigSchema = z.object({ currency: z.enum(BASE_CURRENCIES) });
export type BaseCurrencyConfigInput = z.input<typeof BaseCurrencyConfigSchema>;

export const BaseCurrencyEntrySchema = z.object({
  config: BaseCurrencyConfigSchema,
  versions: z.array(version(BaseCurrencyConfigSchema)).min(1),
});
export type BaseCurrencyEntryDto = z.infer<typeof BaseCurrencyEntrySchema>;

export const SaveBaseCurrencyRequestSchema = z.object({
  config: BaseCurrencyConfigSchema,
  reason: ChangeReasonSchema,
});
