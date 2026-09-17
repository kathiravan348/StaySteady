// Credential reference seeds, usage and health (UI spec 7.18; requirements 472-475). The live
// references are the ones the provider and broker configurations already name, so the areas start
// out agreeing. Dates are relative to the day the mock loads, so expiry warnings stay current.
// Mock references only: no credential value exists anywhere in the app.

import type {
  BrokerConfigInput,
  ConfigHealthDto,
  CredentialConfigInput,
  CredentialUserDto,
  ProviderConfigInput,
} from '../../schemas';

const DAY_MS = 86_400_000;

export const addDaysIso = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export const daysBetweenIso = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

const VAULT = 'Local encrypted vault';

interface Seed extends Omit<CredentialConfigInput, 'issuedOn' | 'expiresOn'> {
  readonly issuedDaysAgo: number;
  // Days from today; null for no expiry.
  readonly expiresInDays: number | null;
}

const SEEDS: readonly Seed[] = [
  {
    reference: 'vault://providers/primary-market-data',
    label: 'Primary market data API key',
    mode: 'live',
    access: 'read_only',
    storedIn: VAULT,
    issuedDaysAgo: 351,
    // Inside the 30-day warning window, so the renewal warning shows.
    expiresInDays: 14,
    warnDaysBefore: 30,
    enabled: true,
  },
  {
    reference: 'vault://providers/backup-market-data',
    label: 'Backup market data API key',
    mode: 'live',
    access: 'read_only',
    storedIn: VAULT,
    issuedDaysAgo: 200,
    expiresInDays: 165,
    warnDaysBefore: 30,
    enabled: true,
  },
  {
    reference: 'vault://providers/news-wire',
    label: 'News wire subscription token',
    mode: 'live',
    access: 'read_only',
    storedIn: VAULT,
    issuedDaysAgo: 420,
    expiresInDays: null,
    warnDaysBefore: 30,
    enabled: true,
  },
  {
    reference: 'vault://brokers/interactive-brokers',
    label: 'Interactive Brokers trading API',
    mode: 'live',
    access: 'trading',
    storedIn: VAULT,
    issuedDaysAgo: 245,
    expiresInDays: 120,
    warnDaysBefore: 21,
    enabled: true,
  },
  {
    reference: 'vault://brokers/zerodha',
    label: 'Zerodha Kite Connect app',
    mode: 'live',
    access: 'trading',
    storedIn: VAULT,
    issuedDaysAgo: 90,
    expiresInDays: 275,
    warnDaysBefore: 14,
    enabled: true,
  },
  {
    reference: 'vault://simulation/brokers/interactive-brokers-paper',
    label: 'Interactive Brokers paper account',
    mode: 'simulation',
    access: 'trading',
    storedIn: VAULT,
    issuedDaysAgo: 245,
    expiresInDays: 120,
    warnDaysBefore: 21,
    enabled: true,
  },
];

export function seedCredentialConfigs(today: string): readonly CredentialConfigInput[] {
  return SEEDS.map(({ issuedDaysAgo, expiresInDays, ...seed }) => ({
    ...seed,
    issuedOn: addDaysIso(today, -issuedDaysAgo),
    expiresOn: expiresInDays === null ? null : addDaysIso(today, expiresInDays),
  }));
}

type History = readonly {
  version: number;
  savedAt: string;
  reason: string;
  snapshot: CredentialConfigInput;
}[];

export function seedCredentialHistory(current: CredentialConfigInput): History {
  const initial = {
    version: 1,
    savedAt: '2024-01-02T00:00:00.000Z',
    reason: 'Initial configuration.',
  };
  // Invented mock history so diff and revert have something to show: last year's renewal.
  if (current.reference === 'vault://providers/primary-market-data') {
    return [
      {
        version: 2,
        savedAt: `${current.issuedOn}T09:00:00.000Z`,
        reason: 'Key rotated at the annual renewal; the old key was revoked at the provider.',
        snapshot: current,
      },
      {
        ...initial,
        snapshot: {
          ...current,
          issuedOn: addDaysIso(current.issuedOn, -365),
          expiresOn: current.issuedOn,
        },
      },
    ];
  }
  return [{ ...initial, snapshot: current }];
}

// Saved provider and broker configurations that name a reference.
export function credentialUsers(
  reference: string,
  providers: readonly ProviderConfigInput[],
  brokers: readonly BrokerConfigInput[],
): CredentialUserDto[] {
  return [
    ...providers
      .filter((provider) => provider.credentialRef === reference)
      .map((provider) => ({
        kind: 'provider' as const,
        id: provider.providerId,
        name: provider.name,
        mode: provider.mode,
        enabled: provider.enabled,
        needsTrading: false,
      })),
    ...brokers
      .filter((broker) => broker.credentialRef === reference)
      .map((broker) => ({
        kind: 'broker' as const,
        id: broker.brokerId,
        name: broker.name,
        mode: broker.mode,
        enabled: broker.enabled,
        needsTrading: broker.connection === 'api' && broker.capabilities.placesOrders,
      })),
  ];
}

const RANK: Readonly<Record<ConfigHealthDto['status'], number>> = {
  critical: 2,
  warning: 1,
  healthy: 0,
};

const names = (users: readonly CredentialUserDto[]): string =>
  users.map((user) => user.name).join(', ');

const days = (count: number): string => `${String(count)} day${count === 1 ? '' : 's'}`;

export function credentialConfigHealth(
  config: CredentialConfigInput,
  users: readonly CredentialUserDto[],
  today: string,
): ConfigHealthDto {
  const findings: ConfigHealthDto[] = [];
  const active = users.filter((user) => user.enabled);
  const left = config.expiresOn === null ? null : daysBetweenIso(today, config.expiresOn);

  if (!config.enabled && active.length > 0) {
    findings.push({
      status: 'critical',
      summary: `Revoked, but ${names(active)} still ${active.length === 1 ? 'uses' : 'use'} it and cannot connect.`,
    });
  }
  if (config.enabled && left !== null && left < 0) {
    findings.push({
      status: 'critical',
      summary: `Expired ${days(-left)} ago on ${String(config.expiresOn)}${active.length > 0 ? `; ${names(active)} cannot connect` : ''}.`,
    });
  } else if (config.enabled && left !== null && left <= config.warnDaysBefore) {
    findings.push({
      status: 'warning',
      summary: `Expires in ${days(left)} on ${String(config.expiresOn)}. Renew it before then.`,
    });
  }
  const crossed = users.filter((user) => user.mode !== config.mode);
  if (crossed.length > 0) {
    findings.push({
      status: 'critical',
      summary: `A ${config.mode} credential used by ${names(crossed)} in ${crossed[0]?.mode ?? ''} mode. Give each mode its own credential.`,
    });
  }
  if (config.access === 'trading' && users.length > 0 && !users.some((user) => user.needsTrading)) {
    findings.push({
      status: 'warning',
      summary:
        'Has trading permission, but nothing using it places orders. Use a read-only credential.',
    });
  }
  const underpowered = users.filter((user) => user.needsTrading && config.access === 'read_only');
  if (underpowered.length > 0) {
    findings.push({
      status: 'warning',
      summary: `Read-only, but ${names(underpowered)} places orders with it.`,
    });
  }
  if (users.length === 0 && config.enabled) {
    findings.push({
      status: 'warning',
      summary: 'Nothing uses this reference. Revoke it if it is no longer needed.',
    });
  }

  const worst = [...findings].sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  if (worst !== undefined) {
    return findings.length > 1
      ? { status: worst.status, summary: `${worst.summary} (+${String(findings.length - 1)} more)` }
      : worst;
  }
  if (!config.enabled) return { status: 'healthy', summary: 'Revoked; nothing uses it.' };
  return {
    status: 'healthy',
    summary: `Used by ${names(users)}; ${left === null ? 'does not expire' : `expires in ${days(left)}`}.`,
  };
}
