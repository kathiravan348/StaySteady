// In-memory configuration for the page load (decisions 33 and 37). Each entry keeps every saved
// version as a full snapshot, newest first, so diff and revert work from the same record.

import type { MarketConfigInput, ProviderConfigInput } from '../../schemas';
import {
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

type VersionStore<T> = Map<string, StoredVersion<T>[]>;

function appendVersion<T>(
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
