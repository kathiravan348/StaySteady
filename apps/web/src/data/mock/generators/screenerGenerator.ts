// Mock generator and filter engine for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import { Decimal } from 'decimal.js';

import type {
  ScreenerFilterCriteria,
  ScreenerRow,
  ScreenerSearchResult,
} from '../../schemas/screener';

export { SCREENER_PRESETS } from './screenerPresets';
export { SCREENER_UNIVERSE } from './screenerSeeds';

export function executeScreenerSearch(
  criteria: ScreenerFilterCriteria,
  universe: readonly ScreenerRow[],
): ScreenerSearchResult {
  let filtered = [...universe];

  // Text search
  if (criteria.query.trim().length > 0) {
    const q = criteria.query.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.sector.toLowerCase().includes(q),
    );
  }

  // Markets
  if (criteria.markets.length > 0) {
    filtered = filtered.filter((r) => criteria.markets.includes(r.marketId));
  }

  // Asset Classes
  if (criteria.assetClasses.length > 0) {
    filtered = filtered.filter((r) => criteria.assetClasses.includes(r.assetClass));
  }

  // Valuation: P/E
  if (criteria.minPe !== null) {
    filtered = filtered.filter((r) => r.peRatio !== null && r.peRatio >= criteria.minPe!);
  }
  if (criteria.maxPe !== null) {
    filtered = filtered.filter((r) => r.peRatio !== null && r.peRatio <= criteria.maxPe!);
  }

  // Valuation: P/B
  if (criteria.minPb !== null) {
    filtered = filtered.filter((r) => r.pbRatio !== null && r.pbRatio >= criteria.minPb!);
  }
  if (criteria.maxPb !== null) {
    filtered = filtered.filter((r) => r.pbRatio !== null && r.pbRatio <= criteria.maxPb!);
  }

  // Quality: ROE
  if (criteria.minRoe !== null) {
    filtered = filtered.filter((r) => r.roePct !== null && r.roePct >= criteria.minRoe!);
  }

  // Quality: Dividend Yield
  if (criteria.minDivYield !== null) {
    filtered = filtered.filter(
      (r) => r.dividendYieldPct !== null && r.dividendYieldPct >= criteria.minDivYield!,
    );
  }

  // Size: Market Cap
  if (criteria.minMarketCap !== null) {
    filtered = filtered.filter((r) => r.marketCapNumber >= criteria.minMarketCap!);
  }

  // Momentum: RSI-14
  if (criteria.minRsi14 !== null) {
    filtered = filtered.filter((r) => r.rsi14 >= criteria.minRsi14!);
  }
  if (criteria.maxRsi14 !== null) {
    filtered = filtered.filter((r) => r.rsi14 <= criteria.maxRsi14!);
  }

  // Trend: 200 SMA Distance
  if (criteria.minSma200Dist !== null) {
    filtered = filtered.filter((r) => r.sma200DistancePct >= criteria.minSma200Dist!);
  }

  // Safety: Compliance Status
  if (criteria.complianceOnly) {
    filtered = filtered.filter((r) => r.complianceStatus === 'ALLOWED');
  }

  // Safety: Automation Permission
  if (criteria.automationOnly) {
    filtered = filtered.filter((r) => r.automationPermission === 'LIVE');
  }

  // Sorting
  const direction = criteria.sortOrder === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    if (criteria.sortBy === 'symbol') return direction * a.symbol.localeCompare(b.symbol);
    if (criteria.sortBy === 'price') return direction * new Decimal(a.price).comparedTo(b.price);

    let aVal: number;
    let bVal: number;
    switch (criteria.sortBy) {
      case 'peRatio':
        aVal = a.peRatio ?? 999999;
        bVal = b.peRatio ?? 999999;
        break;
      case 'roePct':
        aVal = a.roePct ?? -999999;
        bVal = b.roePct ?? -999999;
        break;
      case 'dividendYieldPct':
        aVal = a.dividendYieldPct ?? -999999;
        bVal = b.dividendYieldPct ?? -999999;
        break;
      case 'rsi14':
        aVal = a.rsi14;
        bVal = b.rsi14;
        break;
      case 'sma200DistancePct':
        aVal = a.sma200DistancePct;
        bVal = b.sma200DistancePct;
        break;
      case 'marketCap':
      default:
        aVal = a.marketCapNumber;
        bVal = b.marketCapNumber;
        break;
    }

    return direction * (aVal - bVal);
  });

  // Calculate summary metrics on filtered set
  const peValues = filtered
    .map((r) => r.peRatio)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);
  const medianPe = peValues.length > 0 ? (peValues[Math.floor(peValues.length / 2)] ?? null) : null;

  const roeValues = filtered
    .map((r) => r.roePct)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);
  const medianRoePct =
    roeValues.length > 0 ? (roeValues[Math.floor(roeValues.length / 2)] ?? null) : null;

  const divValues = filtered
    .map((r) => r.dividendYieldPct)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);
  const medianDivYieldPct =
    divValues.length > 0 ? (divValues[Math.floor(divValues.length / 2)] ?? null) : null;

  // Pagination
  const total = filtered.length;
  const page = criteria.page || 1;
  const pageSize = criteria.pageSize || 10;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const rows = filtered.slice(startIndex, startIndex + pageSize);

  return {
    rows,
    summary: {
      universeCount: universe.length,
      matchedCount: total,
      medianPe,
      medianRoePct,
      medianDivYieldPct,
    },
    total,
    page,
    pageSize,
    totalPages,
  };
}
