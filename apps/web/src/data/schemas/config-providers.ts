// Data provider configuration (UI spec 7.18). As with markets, the cross-field rules live in the
// schema so the form's inline validation and the server's save validation are one check.

import { z } from 'zod';

import { CurrencyCodeSchema, IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema, ConfigModeSchema } from './config';

export const ProviderDataKindSchema = z.enum([
  'prices',
  'intraday',
  'fundamentals',
  'corporate_actions',
  'fx',
  'news',
]);
export type ProviderDataKindDto = z.infer<typeof ProviderDataKindSchema>;

export const ProviderGranularitySchema = z.enum(['1m', '5m', '15m', '1h', '1d']);
export type ProviderGranularityDto = z.infer<typeof ProviderGranularitySchema>;

// Data that comes as bars or rates has a granularity; news, fundamentals and actions do not.
export const TIMED_DATA_KINDS: readonly ProviderDataKindDto[] = ['prices', 'intraday', 'fx'];
const INTRADAY_GRANULARITIES: readonly ProviderGranularityDto[] = ['1m', '5m', '15m', '1h'];

const amount = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Enter an amount such as 120.00');
const wholeNumber = (label: string): z.ZodNumber =>
  z.number().int('Whole numbers only').positive(`${label} must be at least 1`);

// A reference into the credential store, never the credential itself.
export const CREDENTIAL_REFERENCE_PATTERN = /^vault:\/\/[a-z0-9][a-z0-9/_-]*$/;

export const ProviderConfigSchema = z
  .object({
    providerId: z
      .string()
      .regex(/^prov-[a-z0-9-]{2,30}$/, 'Use prov- then lowercase letters, digits or dashes'),
    name: z.string().trim().min(1, 'A provider needs a name'),
    coverage: z.object({
      markets: z.array(z.string().min(1)).min(1, 'Cover at least one market'),
      dataKinds: z.array(ProviderDataKindSchema).min(1, 'Provide at least one kind of data'),
    }),
    granularities: z.array(ProviderGranularitySchema),
    historyDepthYears: z
      .number()
      .min(0, 'Cannot be negative')
      .max(100, 'Above 100 years is not a history depth'),
    rateLimits: z.object({
      requestsPerMinute: wholeNumber('The per-minute limit'),
      requestsPerMonth: wholeNumber('The monthly limit'),
    }),
    cost: z.object({
      currency: CurrencyCodeSchema,
      monthlyBudget: amount,
      perThousandRequests: amount,
    }),
    // 1 is asked first; a higher number is only used when every lower one has failed.
    priority: z
      .number()
      .int('Whole numbers only')
      .min(1, 'Priority starts at 1')
      .max(20, 'Use 20 or lower'),
    requiresCredential: z.boolean(),
    credentialRef: z.string().nullable(),
    healthCheck: z.object({
      intervalSeconds: z
        .number()
        .int('Whole seconds only')
        .min(10, 'Check at most every 10 seconds')
        .max(3600, 'Check at least once an hour'),
      timeoutMs: z
        .number()
        .int('Whole milliseconds only')
        .min(100, 'At least 100 ms')
        .max(30_000, 'At most 30 seconds'),
    }),
    // How old the newest data may be before it counts as late on System Health.
    freshnessSeconds: wholeNumber('The freshness expectation'),
    enabled: z.boolean(),
    mode: ConfigModeSchema,
  })
  .superRefine((config, ctx) => {
    const issue = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };

    const timed = config.coverage.dataKinds.some((kind) => TIMED_DATA_KINDS.includes(kind));
    if (timed && config.granularities.length === 0) {
      issue(['granularities'], 'Prices, intraday bars and FX rates need at least one granularity');
    }
    if (!timed && config.granularities.length > 0) {
      issue(['granularities'], 'Granularity only applies to prices, intraday bars and FX rates');
    }
    if (
      config.coverage.dataKinds.includes('intraday') &&
      !config.granularities.some((item) => INTRADAY_GRANULARITIES.includes(item))
    ) {
      issue(['granularities'], 'Intraday data needs a granularity shorter than a day');
    }

    if (config.rateLimits.requestsPerMinute > config.rateLimits.requestsPerMonth) {
      issue(['rateLimits', 'requestsPerMinute'], 'Cannot be above the monthly limit');
    }

    if (config.healthCheck.timeoutMs >= config.healthCheck.intervalSeconds * 1000) {
      issue(['healthCheck', 'timeoutMs'], 'A check must time out before the next one is due');
    }

    const ref = config.credentialRef;
    if (ref === null || ref.trim() === '') {
      if (config.requiresCredential) {
        issue(['credentialRef'], 'This provider needs a credential reference');
      }
    } else if (!CREDENTIAL_REFERENCE_PATTERN.test(ref)) {
      issue(
        ['credentialRef'],
        ref.includes('://')
          ? 'Use a credential store reference, such as vault://providers/name'
          : 'This looks like a key, not a reference. Put the key in the credential store and enter its reference',
      );
    }
  });
export type ProviderConfigDto = z.infer<typeof ProviderConfigSchema>;
export type ProviderConfigInput = z.input<typeof ProviderConfigSchema>;

export const ProviderConfigVersionSchema = z.object({
  version: z.number().int().positive(),
  savedAt: IsoUtcTimestampSchema,
  reason: z.string().min(1),
  snapshot: ProviderConfigSchema,
});
export type ProviderConfigVersionDto = z.infer<typeof ProviderConfigVersionSchema>;

export const ProviderConfigEntrySchema = z.object({
  config: ProviderConfigSchema,
  health: ConfigHealthSchema,
  // Newest first; the first is what is in force.
  versions: z.array(ProviderConfigVersionSchema).min(1),
});
export type ProviderConfigEntryDto = z.infer<typeof ProviderConfigEntrySchema>;

export const ProviderConfigListSchema = z.array(ProviderConfigEntrySchema);

export const SaveProviderConfigRequestSchema = z.object({
  config: ProviderConfigSchema,
  reason: ChangeReasonSchema,
});

export const TestProviderConnectionRequestSchema = z.object({ config: ProviderConfigSchema });
