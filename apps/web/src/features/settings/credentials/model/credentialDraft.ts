// Editing a credential reference (UI spec 7.18): a blank new entry, labels, references the other
// configuration areas name but nobody registered, and a version described in the screen's own words.

import type {
  BrokerConfigEntryDto,
  CredentialAccessDto,
  CredentialConfigEntryDto,
  CredentialConfigInput,
  ProviderConfigEntryDto,
} from '../../../../data/schemas';

export const ACCESS_LABELS: Readonly<Record<CredentialAccessDto, string>> = {
  read_only: 'Read only',
  trading: 'Can place orders',
};

export const ACCESS_OPTIONS = (['read_only', 'trading'] as const).map((value) => ({
  value,
  label: ACCESS_LABELS[value],
}));

// New entries start in simulation, read-only, with no expiry decided yet (UI spec 7.18).
export function blankCredential(today: string): CredentialConfigInput {
  return {
    reference: 'vault://simulation/',
    label: '',
    mode: 'simulation',
    access: 'read_only',
    storedIn: 'Local encrypted vault',
    issuedOn: today,
    expiresOn: null,
    warnDaysBefore: 30,
    enabled: true,
  };
}

export function describeCredential(config: CredentialConfigInput): Record<string, string> {
  return {
    Reference: config.reference,
    Label: config.label,
    Mode: config.mode === 'live' ? 'Live' : 'Simulation',
    Access: ACCESS_LABELS[config.access],
    'Stored in': config.storedIn,
    Issued: config.issuedOn,
    Expires: config.expiresOn ?? 'Does not expire',
    'Warn before expiry': `${String(config.warnDaysBefore)} days`,
    Enabled: config.enabled ? 'Yes' : 'No (revoked)',
  };
}

export interface UnregisteredReference {
  readonly reference: string;
  readonly users: readonly string[];
}

// References a saved provider or broker names that the register does not hold: whatever uses them
// has nothing to connect with.
export function unregisteredReferences(
  entries: readonly CredentialConfigEntryDto[],
  providers: readonly ProviderConfigEntryDto[],
  brokers: readonly BrokerConfigEntryDto[],
): readonly UnregisteredReference[] {
  const known = new Set(entries.map((entry) => entry.config.reference));
  const byReference = new Map<string, string[]>();
  const add = (reference: string | null, name: string): void => {
    if (reference === null || reference === '' || known.has(reference)) return;
    byReference.set(reference, [...(byReference.get(reference) ?? []), name]);
  };
  providers.forEach((entry) => {
    add(entry.config.credentialRef, entry.config.name);
  });
  brokers.forEach((entry) => {
    add(entry.config.credentialRef, entry.config.name);
  });
  return [...byReference].map(([reference, users]) => ({ reference, users }));
}
