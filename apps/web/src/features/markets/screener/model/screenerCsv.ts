// CSV export of the screener results (S-26), moved out of the results table so the table stays
// under the file limit as statement factors were added (R-13).

import type { ScreenerRow } from '../../../../data/schemas/screener';

const quoted = (value: string): string => `"${value.replace(/"/g, '""')}"`;
const fixed = (value: number | null, places: number): string =>
  value === null ? '' : value.toFixed(places);

const HEADERS = [
  'Symbol',
  'Name',
  'Market',
  'Asset Class',
  'Sector',
  'Price',
  '24h Change (%)',
  'Market Cap',
  'P/E Ratio',
  'P/B Ratio',
  'ROE (%)',
  'Div Yield (%)',
  'Debt to Equity',
  'ROCE (%)',
  'Revenue Growth 3y (%)',
  'Cash Conversion (%)',
  'RSI-14',
  '200 SMA Dist (%)',
  'Compliance Status',
  'Automation Permission',
];

export function screenerCsv(rows: readonly ScreenerRow[]): string {
  const lines = rows.map((r) =>
    [
      r.symbol,
      quoted(r.name),
      r.marketName,
      r.assetClass,
      quoted(r.sector),
      r.price,
      r.change24hPct.toFixed(2),
      r.marketCapFormatted,
      fixed(r.peRatio, 1),
      fixed(r.pbRatio, 1),
      fixed(r.roePct, 1),
      fixed(r.dividendYieldPct, 2),
      fixed(r.debtToEquity, 2),
      fixed(r.rocePct, 1),
      fixed(r.revenueGrowth3yPct, 1),
      fixed(r.cashConversionPct, 1),
      r.rsi14.toFixed(1),
      r.sma200DistancePct.toFixed(1),
      r.complianceStatus,
      r.automationPermission,
    ].join(','),
  );
  return [HEADERS.join(','), ...lines].join('\n');
}

export function downloadScreenerCsv(rows: readonly ScreenerRow[]): void {
  const blob = new Blob([screenerCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `screener_export_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
