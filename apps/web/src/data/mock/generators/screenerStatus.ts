// Compliance status and automation permission for each screener row (S-26; requirements 27 and 233).
// Worked out on every search from the same sources as /compliance and /settings/automation, so a
// restriction added there, or a market switched to simulation, shows in the screener at once.

import type { EligibilityCheckResult } from '../../schemas/compliance';
import type { ScreenerRow } from '../../schemas/screener';
import type { PermissionInputs } from '../../../shared/automation/permissionLayers';
import { evaluateCell } from '../../../shared/automation/permissionLayers';
import type { FactoredSeed, ScreenerSeed } from './screenerSeeds';

export interface ScreenerStatusSources {
  readonly checkEligibility: (symbol: string, action: 'BUY' | 'SELL') => EligibilityCheckResult;
  readonly permissions: PermissionInputs;
}

// Screener listings name the exchange; configuration is kept per market.
const CONFIG_MARKET_BY_LISTING: Readonly<Record<string, string>> = {
  'us-nasdaq': 'US',
  'us-nyse': 'US',
  'in-nse': 'IN',
};

// The screener is a long-term discovery tool, so common stock is judged as a long-term holding.
const INSTRUMENT_TYPE_BY_ASSET_CLASS = {
  EQUITY: 'long_term',
  ETF: 'etf',
} as const satisfies Record<ScreenerSeed['assetClass'], string>;

type ComplianceFields = Pick<ScreenerRow, 'complianceStatus' | 'complianceReason'>;

function complianceFor(seed: ScreenerSeed, sources: ScreenerStatusSources): ComplianceFields {
  const buy = sources.checkEligibility(seed.symbol, 'BUY');
  if (buy.rule === 'restricted_list') {
    return { complianceStatus: 'RESTRICTED', complianceReason: buy.primaryReason };
  }
  if (buy.rule === 'blackout') {
    return { complianceStatus: 'BLACKOUT', complianceReason: buy.primaryReason };
  }
  const sell = sources.checkEligibility(seed.symbol, 'SELL');
  if (sell.rule === 'holding_lock') {
    return { complianceStatus: 'LOCKED', complianceReason: sell.primaryReason };
  }
  return { complianceStatus: 'ALLOWED', complianceReason: null };
}

function automationFor(
  seed: ScreenerSeed,
  sources: ScreenerStatusSources,
): ScreenerRow['automationPermission'] {
  const marketId = CONFIG_MARKET_BY_LISTING[seed.marketId];
  if (marketId === undefined) return 'BLOCKED';
  const cell = evaluateCell(
    sources.permissions,
    marketId,
    INSTRUMENT_TYPE_BY_ASSET_CLASS[seed.assetClass],
  );
  return cell.outcome === 'live'
    ? 'LIVE'
    : cell.outcome === 'simulation'
      ? 'SIMULATION'
      : 'BLOCKED';
}

export function withScreenerStatus(
  seeds: readonly FactoredSeed[],
  sources: ScreenerStatusSources,
): ScreenerRow[] {
  return seeds.map((seed) => ({
    ...seed,
    ...complianceFor(seed, sources),
    automationPermission: automationFor(seed, sources),
  }));
}
