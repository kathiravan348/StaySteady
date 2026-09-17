// Instrument type configuration (UI spec 7.18). One entry per instrument type; the cross-field rules
// live in the schema so the form's inline validation and the server's save validation are one check.

import { z } from 'zod';

import { IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema } from './config';
import { ProviderGranularitySchema } from './config-providers';
import { InstrumentTypeSchema } from './instruments';

const INTRADAY_GRANULARITIES = ['1m', '5m', '15m', '1h'];

export const InstrumentTypeConfigSchema = z
  .object({
    type: InstrumentTypeSchema,
    enabled: z.boolean(),
    automationPermitted: z.boolean(),
    // Traded and recorded by hand only: no price feed is required and nothing is automated.
    manualOnly: z.boolean(),
    markets: z.array(z.string().min(1)),
    granularities: z.array(ProviderGranularitySchema),
    minimumQuantity: z
      .string()
      .regex(/^\d+(\.\d{1,8})?$/, 'Enter a quantity such as 1 or 0.001')
      .refine((value) => /[1-9]/.test(value), 'Must be above zero'),
    // In the currency of each trade; 0 means no minimum.
    minimumOrderValue: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Enter an amount such as 100.00'),
    // Null follows each market's own setting.
    settlementDays: z
      .number()
      .int('Whole days only')
      .min(0, 'Cannot be negative')
      .max(10, 'Above 10 days is not a settlement cycle')
      .nullable(),
  })
  .superRefine((config, ctx) => {
    const issue = (path: string[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    if (config.enabled && config.markets.length === 0) {
      issue(['markets'], 'An enabled instrument type needs at least one market');
    }
    if (config.manualOnly && config.automationPermitted) {
      issue(['automationPermitted'], 'A manual-only type is never automated');
    }
    if (!config.manualOnly && config.granularities.length === 0) {
      issue(['granularities'], 'Choose at least one granularity, or mark the type manual-only');
    }
    if (
      config.type === 'intraday' &&
      !config.manualOnly &&
      !config.granularities.some((item) => INTRADAY_GRANULARITIES.includes(item))
    ) {
      issue(['granularities'], 'Intraday trading needs a granularity shorter than a day');
    }
  });
export type InstrumentTypeConfigDto = z.infer<typeof InstrumentTypeConfigSchema>;
export type InstrumentTypeConfigInput = z.input<typeof InstrumentTypeConfigSchema>;

export const InstrumentTypeConfigEntrySchema = z.object({
  config: InstrumentTypeConfigSchema,
  health: ConfigHealthSchema,
  versions: z
    .array(
      z.object({
        version: z.number().int().positive(),
        savedAt: IsoUtcTimestampSchema,
        reason: z.string().min(1),
        snapshot: InstrumentTypeConfigSchema,
      }),
    )
    .min(1),
});
export type InstrumentTypeConfigEntryDto = z.infer<typeof InstrumentTypeConfigEntrySchema>;

export const InstrumentTypeConfigListSchema = z.array(InstrumentTypeConfigEntrySchema);

export const SaveInstrumentTypeConfigRequestSchema = z.object({
  config: InstrumentTypeConfigSchema,
  reason: ChangeReasonSchema,
});
