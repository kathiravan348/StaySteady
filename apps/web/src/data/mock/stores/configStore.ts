// In-memory configuration for the page load (decisions 33 and 37). Each entry keeps every saved
// version as a full snapshot, newest first, so diff and revert work from the same record.

import type { MarketConfigInput } from '../../schemas';
import { seedMarketConfigs, seedMarketHistory } from '../generators';

export interface StoredVersion<T> {
  readonly version: number;
  readonly savedAt: string;
  readonly reason: string;
  readonly snapshot: T;
}

let markets: Map<string, StoredVersion<MarketConfigInput>[]> | null = null;

export function getMarketVersions(): Map<string, StoredVersion<MarketConfigInput>[]> {
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
  const store = getMarketVersions();
  const existing = store.get(marketId) ?? [];
  const next = (existing[0]?.version ?? 0) + 1;
  store.set(marketId, [{ version: next, savedAt, reason, snapshot }, ...existing]);
}
