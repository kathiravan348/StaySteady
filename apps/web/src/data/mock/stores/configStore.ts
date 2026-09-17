// In-memory configuration for the page load (decisions 33 and 37). Each entry keeps every saved
// version as a full snapshot, newest first, so diff and revert work from the same record.

import type {
  AlertRuleConfigInput,
  BaseCurrencyConfigInput,
  BrokerConfigInput,
  CredentialConfigInput,
  CurrencyConfigInput,
  InstrumentTypeConfigInput,
  MarketConfigInput,
  ProviderConfigInput,
} from '../../schemas';
import {
  seedAlertRuleHistory,
  seedAlertRules,
  seedBaseCurrency,
  seedCredentialConfigs,
  seedCredentialHistory,
  seedCurrencyConfigs,
  seedCurrencyHistory,
  seedInstrumentTypeConfigs,
  seedInstrumentTypeHistory,
  seedBrokerConfigs,
  seedBrokerHistory,
  seedMarketConfigs,
  seedMarketHistory,
  seedProviderConfigs,
  seedProviderHistory,
} from '../generators';

export interface StoredVersion<T> {
  readonly version: number;
  readonly savedAt: string;
  readonly reason: string;
  readonly snapshot: T;
}

export type VersionStore<T> = Map<string, StoredVersion<T>[]>;

export function appendVersion<T>(
  store: VersionStore<T>,
  id: string,
  snapshot: T,
  reason: string,
  savedAt: string,
): void {
  const existing = store.get(id) ?? [];
  const next = (existing[0]?.version ?? 0) + 1;
  store.set(id, [{ version: next, savedAt, reason, snapshot }, ...existing]);
}

let markets: VersionStore<MarketConfigInput> | null = null;
let providers: VersionStore<ProviderConfigInput> | null = null;
let brokers: VersionStore<BrokerConfigInput> | null = null;

export function getMarketVersions(): VersionStore<MarketConfigInput> {
  markets ??= new Map(
    seedMarketConfigs().map((config) => [config.marketId, [...seedMarketHistory(config)]]),
  );
  return markets;
}

export function appendMarketVersion(
  marketId: string,
  snapshot: MarketConfigInput,
  reason: string,
  savedAt: string,
): void {
  appendVersion(getMarketVersions(), marketId, snapshot, reason, savedAt);
}

export function getProviderVersions(): VersionStore<ProviderConfigInput> {
  providers ??= new Map(
    seedProviderConfigs().map((config) => [config.providerId, [...seedProviderHistory(config)]]),
  );
  return providers;
}

export function appendProviderVersion(
  providerId: string,
  snapshot: ProviderConfigInput,
  reason: string,
  savedAt: string,
): void {
  appendVersion(getProviderVersions(), providerId, snapshot, reason, savedAt);
}

export function getBrokerVersions(): VersionStore<BrokerConfigInput> {
  brokers ??= new Map(
    seedBrokerConfigs().map((config) => [config.brokerId, [...seedBrokerHistory(config)]]),
  );
  return brokers;
}

export function appendBrokerVersion(
  brokerId: string,
  snapshot: BrokerConfigInput,
  reason: string,
  savedAt: string,
): void {
  appendVersion(getBrokerVersions(), brokerId, snapshot, reason, savedAt);
}

let instrumentTypes: VersionStore<InstrumentTypeConfigInput> | null = null;
let currencies: VersionStore<CurrencyConfigInput> | null = null;
let baseCurrency: VersionStore<BaseCurrencyConfigInput> | null = null;
let alertRules: VersionStore<AlertRuleConfigInput> | null = null;

const current = <T>(store: VersionStore<T>): T[] =>
  [...store.values()].flatMap((versions) =>
    versions[0] === undefined ? [] : [versions[0].snapshot],
  );

// Seeded from the saved market and broker configurations, so the areas start out agreeing.
export function getInstrumentTypeVersions(): VersionStore<InstrumentTypeConfigInput> {
  instrumentTypes ??= new Map(
    seedInstrumentTypeConfigs(current(getMarketVersions()), current(getBrokerVersions())).map(
      (config) => [config.type, [...seedInstrumentTypeHistory(config)]],
    ),
  );
  return instrumentTypes;
}

export function getCurrencyVersions(): VersionStore<CurrencyConfigInput> {
  currencies ??= new Map(
    seedCurrencyConfigs().map((config) => [config.currency, [...seedCurrencyHistory(config)]]),
  );
  return currencies;
}

// A single entry under the key "base".
export function getBaseCurrencyVersions(): VersionStore<BaseCurrencyConfigInput> {
  baseCurrency ??= new Map([['base', [...seedBaseCurrency()]]]);
  return baseCurrency;
}

export function getAlertRuleVersions(): VersionStore<AlertRuleConfigInput> {
  alertRules ??= new Map(
    seedAlertRules().map((config) => [config.ruleId, [...seedAlertRuleHistory(config)]]),
  );
  return alertRules;
}

let credentials: VersionStore<CredentialConfigInput> | null = null;

// Keyed by the reference itself, which is what provider and broker configurations name.
export function getCredentialVersions(): VersionStore<CredentialConfigInput> {
  credentials ??= new Map(
    seedCredentialConfigs(new Date().toISOString().slice(0, 10)).map((config) => [
      config.reference,
      [...seedCredentialHistory(config)],
    ]),
  );
  return credentials;
}

export function currentConfigs<T>(store: VersionStore<T>): T[] {
  return current(store);
}
