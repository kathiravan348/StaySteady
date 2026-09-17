// Mock generator and filter engine for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { ScreenerFilterCriteria, ScreenerSearchResult } from '../../schemas/screener';
import { SCREENER_UNIVERSE } from './screenerSeeds';

export { SCREENER_PRESETS } from './screenerPresets';
export { SCREENER_UNIVERSE } from './screenerSeeds';

export function executeScreenerSearch(criteria: ScreenerFilterCriteria): ScreenerSearchResult {
  let filtered = [...SCREENER_UNIVERSE];

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
  filtered.sort((a, b) => {
    let aVal: number | string | null = null;
    let bVal: number | string | null = null;

    switch (criteria.sortBy) {
      case 'symbol':
        aVal = a.symbol;
        bVal = b.symbol;
        break;
      case 'price':
        aVal = parseFloat(a.price);
        bVal = parseFloat(b.price);
        break;
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

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return criteria.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    const numA = (aVal as number) ?? 0;
    const numB = (bVal as number) ?? 0;
    return criteria.sortOrder === 'asc' ? numA - numB : numB - numA;
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
      universeCount: SCREENER_UNIVERSE.length,
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
