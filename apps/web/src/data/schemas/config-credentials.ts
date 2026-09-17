// Credential references (UI spec 7.18; requirements 472-475). An entry says where a secret is kept and
// what it may do, never what it is: there is no field for a value, and a value typed where the
// reference belongs is rejected.

import { z } from 'zod';

import { IsoUtcTimestampSchema } from './common';
import { ChangeReasonSchema, ConfigHealthSchema, ConfigModeSchema } from './config';
import { CREDENTIAL_REFERENCE_PATTERN } from './config-providers';

// Read-only wherever trading permission is not needed (requirement 473).
export const CredentialAccessSchema = z.enum(['read_only', 'trading']);
export type CredentialAccessDto = z.infer<typeof CredentialAccessSchema>;

// A simulation reference carries a "simulation" path segment and a live one never does, so the two
// sets cannot be confused by reading the reference alone (requirement 474).
const SIMULATION_SEGMENT = /\/simulation(\/|$)/;

const date = z.iso.date({ error: 'Enter a date' });

export const CredentialConfigSchema = z
  .object({
    reference: z.string().trim().min(1, 'Enter the credential store reference'),
    label: z.string().trim().min(1, 'Say what this credential is for'),
    mode: ConfigModeSchema,
    access: CredentialAccessSchema,
    // Where the secret itself is kept, in words, such as "Local encrypted vault".
    storedIn: z.string().trim().min(1, 'Say where the secret is kept'),
    issuedOn: date,
    // Null for a credential that does not expire.
    expiresOn: date.nullable(),
    warnDaysBefore: z
      .number()
      .int('Whole days only')
      .min(1, 'Warn at least a day ahead')
      .max(90, 'More than 90 days ahead is not a warning'),
    // Off means revoked: anything still using it can no longer connect.
    enabled: z.boolean(),
  })
  .superRefine((config, ctx) => {
    const issue = (path: string[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    const ref = config.reference;
    if (!CREDENTIAL_REFERENCE_PATTERN.test(ref)) {
      issue(
        ['reference'],
        ref.startsWith('vault://') || ref === ''
          ? 'Use lowercase letters, digits, dashes and slashes after vault://'
          : 'This looks like a key, not a reference. Put the key in the credential store and enter its reference',
      );
    } else if (config.mode === 'simulation' && !SIMULATION_SEGMENT.test(ref)) {
      issue(
        ['reference'],
        'A simulation reference needs a /simulation/ segment, such as vault://simulation/brokers/name',
      );
    } else if (config.mode === 'live' && SIMULATION_SEGMENT.test(ref)) {
      issue(['reference'], 'A live reference cannot contain a /simulation/ segment');
    }
    if (config.expiresOn !== null && config.expiresOn <= config.issuedOn) {
      issue(['expiresOn'], 'The expiry date must be after the issue date');
    }
  });
export type CredentialConfigDto = z.infer<typeof CredentialConfigSchema>;
export type CredentialConfigInput = z.input<typeof CredentialConfigSchema>;

// A saved provider or broker configuration that names this reference.
export const CredentialUserSchema = z.object({
  kind: z.enum(['provider', 'broker']),
  id: z.string().min(1),
  name: z.string().min(1),
  mode: ConfigModeSchema,
  enabled: z.boolean(),
  // A broker that places orders needs trading access; everything else reads.
  needsTrading: z.boolean(),
});
export type CredentialUserDto = z.infer<typeof CredentialUserSchema>;

export const CredentialConfigEntrySchema = z.object({
  config: CredentialConfigSchema,
  health: ConfigHealthSchema,
  usedBy: z.array(CredentialUserSchema),
  // Whole days until expiry from today; negative once expired, null when it does not expire.
  daysToExpiry: z.number().int().nullable(),
  versions: z
    .array(
      z.object({
        version: z.number().int().positive(),
        savedAt: IsoUtcTimestampSchema,
        reason: z.string().min(1),
        snapshot: CredentialConfigSchema,
      }),
    )
    .min(1),
});
export type CredentialConfigEntryDto = z.infer<typeof CredentialConfigEntrySchema>;

export const CredentialConfigListSchema = z.array(CredentialConfigEntrySchema);

export const SaveCredentialConfigRequestSchema = z.object({
  config: CredentialConfigSchema,
  reason: ChangeReasonSchema,
});
