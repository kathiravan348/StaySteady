// Broker configuration (UI spec 7.18). As with markets and providers, the cross-field rules live in the
// schema so the form's inline validation and the server's save validation are one check.

import { z } from 'zod';

import { CurrencyCodeSchema, IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema, ConfigModeSchema } from './config';
import { CREDENTIAL_REFERENCE_PATTERN } from './config-providers';
import { InstrumentTypeSchema } from './instruments';
import { OrderTypeSchema } from './trading';

// An API broker is connected; a manual one is tracked from imported statements and never trades.
export const BrokerConnectionSchema = z.enum(['api', 'manual']);
export type BrokerConnectionDto = z.infer<typeof BrokerConnectionSchema>;

export const BrokerFeeModelSchema = z.enum(['percentage', 'flat', 'none']);
export type BrokerFeeModelDto = z.infer<typeof BrokerFeeModelSchema>;

const amount = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Enter an amount such as 1.00');
const isZero = (value: string): boolean => /^0+(\.0+)?$/.test(value);

export const BrokerCapabilitiesSchema = z.object({
  placesOrders: z.boolean(),
  streamsPositions: z.boolean(),
  fractionalQuantities: z.boolean(),
  shortSelling: z.boolean(),
  // The broker offers a paper account; without one, simulation runs on the platform's own model.
  paperAccount: z.boolean(),
});
export type BrokerCapabilitiesDto = z.infer<typeof BrokerCapabilitiesSchema>;

// Amounts are charged in the currency of each trade.
export const BrokerFeesSchema = z.object({
  model: BrokerFeeModelSchema,
  commissionBps: z.number().min(0, 'Cannot be negative').max(500, 'Above 500 bps is not a fee'),
  minimumPerOrder: amount,
  flatPerOrder: amount,
});
export type BrokerFeesDto = z.infer<typeof BrokerFeesSchema>;

export const BrokerConfigSchema = z
  .object({
    brokerId: z
      .string()
      .regex(/^brk-[a-z0-9-]{2,30}$/, 'Use brk- then lowercase letters, digits or dashes'),
    name: z.string().trim().min(1, 'A broker needs a name'),
    country: z.string().trim().min(1, 'Say which country the account is held in'),
    accountCurrency: CurrencyCodeSchema,
    connection: BrokerConnectionSchema,
    markets: z.array(z.string().min(1)).min(1, 'Choose at least one market'),
    instrumentTypes: z.array(InstrumentTypeSchema).min(1, 'Choose at least one instrument type'),
    orderTypes: z.array(OrderTypeSchema),
    capabilities: BrokerCapabilitiesSchema,
    fees: BrokerFeesSchema,
    credentialRef: z.string().nullable(),
    // Instrument types automation may trade here. Each must also be an instrument type above.
    automationTypes: z.array(InstrumentTypeSchema),
    enabled: z.boolean(),
    mode: ConfigModeSchema,
  })
  .superRefine((config, ctx) => {
    const issue = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    const { capabilities: can, fees } = config;

    if (config.connection === 'manual') {
      if (can.placesOrders) {
        issue(
          ['capabilities', 'placesOrders'],
          'A manual broker cannot place orders; connect it first',
        );
      }
      if (can.streamsPositions) {
        issue(
          ['capabilities', 'streamsPositions'],
          'A manual broker has no live positions to stream',
        );
      }
      if (can.paperAccount) {
        issue(['capabilities', 'paperAccount'], 'A paper account needs an API connection');
      }
    } else {
      const ref = config.credentialRef;
      if (ref === null || ref.trim() === '') {
        issue(['credentialRef'], 'A connected broker needs a credential reference');
      } else if (!CREDENTIAL_REFERENCE_PATTERN.test(ref)) {
        issue(
          ['credentialRef'],
          ref.includes('://')
            ? 'Use a credential store reference, such as vault://brokers/name'
            : 'This looks like a key, not a reference. Put the key in the credential store and enter its reference',
        );
      }
    }
    if (
      config.connection === 'manual' &&
      config.credentialRef !== null &&
      config.credentialRef !== ''
    ) {
      issue(['credentialRef'], 'A manual broker has no connection, so it needs no credential');
    }

    if (can.placesOrders && config.orderTypes.length === 0) {
      issue(['orderTypes'], 'A broker that places orders needs at least one order type');
    }
    if (!can.placesOrders && config.orderTypes.length > 0) {
      issue(['orderTypes'], 'Order types only apply to a broker that places orders');
    }
    if (!can.placesOrders && config.automationTypes.length > 0) {
      issue(['automationTypes'], 'Automation needs a broker that places orders');
    }
    const unsupported = config.automationTypes.filter(
      (type) => !config.instrumentTypes.includes(type),
    );
    if (unsupported.length > 0) {
      issue(
        ['automationTypes'],
        'Automation can only be allowed for instrument types this broker trades',
      );
    }

    if (fees.model === 'percentage' && fees.commissionBps === 0) {
      issue(
        ['fees', 'commissionBps'],
        'A percentage fee needs a rate; choose "none" if it is free',
      );
    }
    if (fees.model === 'flat' && isZero(fees.flatPerOrder)) {
      issue(['fees', 'flatPerOrder'], 'A flat fee needs an amount; choose "none" if it is free');
    }
  });
export type BrokerConfigDto = z.infer<typeof BrokerConfigSchema>;
export type BrokerConfigInput = z.input<typeof BrokerConfigSchema>;

export const BrokerConfigVersionSchema = z.object({
  version: z.number().int().positive(),
  savedAt: IsoUtcTimestampSchema,
  reason: z.string().min(1),
  snapshot: BrokerConfigSchema,
});

export const BrokerConfigEntrySchema = z.object({
  config: BrokerConfigSchema,
  health: ConfigHealthSchema,
  // Newest first; the first is what is in force.
  versions: z.array(BrokerConfigVersionSchema).min(1),
});
export type BrokerConfigEntryDto = z.infer<typeof BrokerConfigEntrySchema>;

export const BrokerConfigListSchema = z.array(BrokerConfigEntrySchema);

export const SaveBrokerConfigRequestSchema = z.object({
  config: BrokerConfigSchema,
  reason: ChangeReasonSchema,
});

export const TestBrokerConnectionRequestSchema = z.object({ config: BrokerConfigSchema });
