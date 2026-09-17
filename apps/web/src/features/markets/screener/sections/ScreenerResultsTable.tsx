// Sortable results table for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@staysteady/ui';

import type { ScreenerRow } from '../../../../data/schemas/screener';
import styles from '../Screener.module.scss';

export interface ScreenerResultsTableProps {
  readonly rows: readonly ScreenerRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly sortBy: string;
  readonly sortOrder: 'asc' | 'desc';
  readonly onSortChange: (sortBy: string) => void;
  readonly onPageChange: (newPage: number) => void;
}

export const ScreenerResultsTable: FC<ScreenerResultsTableProps> = ({
  rows,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
}) => {
  const handleExportCsv = () => {
    const headers = [
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
      'RSI-14',
      '200 SMA Dist (%)',
      'Compliance Status',
      'Automation Permission',
    ];

    const lines = rows.map((r) =>
      [
        r.symbol,
        `"${r.name.replace(/"/g, '""')}"`,
        r.marketName,
        r.assetClass,
        `"${r.sector.replace(/"/g, '""')}"`,
        r.price,
        r.change24hPct.toFixed(2),
        r.marketCapFormatted,
        r.peRatio !== null ? r.peRatio.toFixed(1) : '',
        r.pbRatio !== null ? r.pbRatio.toFixed(1) : '',
        r.roePct !== null ? r.roePct.toFixed(1) : '',
        r.dividendYieldPct !== null ? r.dividendYieldPct.toFixed(2) : '',
        r.rsi14.toFixed(1),
        r.sma200DistancePct.toFixed(1),
        r.complianceStatus,
        r.automationPermission,
      ].join(','),
    );

    const csvContent = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `screener_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <Card title="Screening Results">
      <div className={styles.stack}>
        <div className={styles.inlineBetween}>
          <span className={styles.fieldLabel}>
            Displaying {rows.length > 0 ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, total)} of {total} passing instruments
          </span>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleExportCsv}
            isDisabled={rows.length === 0}
          >
            📥 Export CSV
          </Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.sortHeader} onClick={() => onSortChange('symbol')}>
                  Symbol & Name{getSortIndicator('symbol')}
                </th>
                <th>Market & Sector</th>
                <th className={styles.sortHeader} onClick={() => onSortChange('price')}>
                  Price & 24h{getSortIndicator('price')}
                </th>
                <th className={styles.sortHeader} onClick={() => onSortChange('peRatio')}>
                  P/E & P/B{getSortIndicator('peRatio')}
                </th>
                <th className={styles.sortHeader} onClick={() => onSortChange('roePct')}>
                  ROE / Div{getSortIndicator('roePct')}
                </th>
                <th className={styles.sortHeader} onClick={() => onSortChange('rsi14')}>
                  RSI / SMA Dist{getSortIndicator('rsi14')}
                </th>
                <th>Compliance (S-33)</th>
                <th>Automation (S-29)</th>
                <th>Handoffs</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    No instruments match the selected criteria. Try relaxing factor thresholds.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isPositive = row.change24hPct >= 0;
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className={styles.stackTight}>
                          <Link
                            to={`/markets/workspace/${row.symbol.toLowerCase()}`}
                            className={styles.symbolLink}
                          >
                            {row.symbol}
                          </Link>
                          <span className={styles.presetDesc}>{row.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackTight}>
                          <span>{row.marketName}</span>
                          <span className={styles.presetDesc}>
                            {row.sector} ({row.assetClass})
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackTight}>
                          <span>{row.price}</span>
                          <span
                            className={isPositive ? styles.positive : styles.negative}
                            style={{ fontSize: 'var(--font-size-xs)' }}
                          >
                            {isPositive ? '+' : ''}
                            {row.change24hPct.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackTight}>
                          <span>
                            P/E: {row.peRatio !== null ? `${row.peRatio.toFixed(1)}x` : '—'}
                          </span>
                          <span className={styles.presetDesc}>
                            P/B: {row.pbRatio !== null ? `${row.pbRatio.toFixed(1)}x` : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackTight}>
                          <span>
                            ROE: {row.roePct !== null ? `${row.roePct.toFixed(1)}%` : '—'}
                          </span>
                          <span className={styles.presetDesc}>
                            Div:{' '}
                            {row.dividendYieldPct !== null
                              ? `${row.dividendYieldPct.toFixed(2)}%`
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackTight}>
                          <span>RSI: {row.rsi14.toFixed(1)}</span>
                          <span className={styles.presetDesc}>
                            200 SMA: {row.sma200DistancePct >= 0 ? '+' : ''}
                            {row.sma200DistancePct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stackTight}>
                          {row.complianceStatus === 'ALLOWED' && (
                            <Badge variant="positive">Permitted</Badge>
                          )}
                          {row.complianceStatus === 'RESTRICTED' && (
                            <Badge variant="critical">Restricted</Badge>
                          )}
                          {row.complianceStatus === 'BLACKOUT' && (
                            <Badge variant="warning">Blackout</Badge>
                          )}
                          {row.complianceStatus === 'LOCKED' && (
                            <Badge variant="neutral">Lock Period</Badge>
                          )}
                          {row.complianceReason && (
                            <span className={styles.presetDesc}>{row.complianceReason}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {row.automationPermission === 'LIVE' && (
                          <Badge variant="positive">Live Permitted</Badge>
                        )}
                        {row.automationPermission === 'SIMULATION' && (
                          <Badge variant="warning">Sim Only</Badge>
                        )}
                        {row.automationPermission === 'BLOCKED' && (
                          <Badge variant="critical">Blocked</Badge>
                        )}
                      </td>
                      <td>
                        <div className={styles.inline}>
                          <Link
                            to={`/markets/workspace/${row.symbol.toLowerCase()}`}
                            className={styles.actionButton}
                            title="Open in Market Workspace"
                          >
                            Workspace
                          </Link>
                          <Link
                            to="/markets/watchlists"
                            className={styles.actionButton}
                            title="Open Watchlists"
                          >
                            Watchlist
                          </Link>
                          <Link
                            to={`/research/backtest/new?symbol=${row.symbol}`}
                            className={styles.actionButton}
                            title="Launch Backtest"
                          >
                            Backtest
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span>
              Page {page} of {totalPages}
            </span>
            <div className={styles.inline}>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={page <= 1}
                onPress={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={page >= totalPages}
                onPress={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
