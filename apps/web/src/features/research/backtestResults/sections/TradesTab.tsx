import { Badge, DataTable, ErrorState, LoadingState } from '@staysteady/ui';
import type { ColumnDef } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useBacktestTrades } from '../../../../data/api';
import type { BacktestTradeDto } from '../../../../data/api';
import { workspaceTickerPath } from '../../../../routes/routes';
import { formatSignedPercent, humanizeToken, pluralize } from '../../../../shared/format';
import styles from '../BacktestResults.module.scss';

export interface TradesTabProps {
  readonly backtestId: string;
  // The result's own trade count, so the list and the headline metric agree.
  readonly tradeCount: number;
}

const getRowId = (trade: BacktestTradeDto): string => trade.id;

// UI spec 7.10 — trade-by-trade table; each row links to that instrument's chart.
export function TradesTab({ backtestId, tradeCount }: TradesTabProps): ReactElement {
  const trades = useBacktestTrades(backtestId, tradeCount);
  const [onlyOutliers, setOnlyOutliers] = useState(false);
  const rows = useMemo(
    () => (trades.data ?? []).filter((trade) => !onlyOutliers || trade.isOutlier),
    [trades.data, onlyOutliers],
  );

  const columns = useMemo<ColumnDef<BacktestTradeDto, unknown>[]>(
    () => [
      {
        id: 'instrument',
        header: 'Instrument',
        accessorFn: (trade) => trade.instrumentSymbol,
        cell: ({ row }) => (
          <span className={styles.inline}>
            <Link to={workspaceTickerPath(row.original.instrumentSymbol)} className={styles.link}>
              {row.original.instrumentSymbol}
            </Link>
            {row.original.isOutlier && <Badge variant="warning">Outlier</Badge>}
          </span>
        ),
      },
      {
        id: 'side',
        header: 'Side',
        accessorFn: (trade) => trade.side,
        cell: ({ row }) => humanizeToken(row.original.side),
      },
      { id: 'entry', header: 'Entered', accessorFn: (trade) => trade.entryDate },
      { id: 'exit', header: 'Exited', accessorFn: (trade) => trade.exitDate },
      {
        id: 'return',
        header: 'Return',
        accessorFn: (trade) => trade.returnPercent,
        meta: { align: 'end', label: 'Return' },
        cell: ({ row }) => (
          <span className={row.original.returnPercent >= 0 ? styles.positive : styles.negative}>
            {formatSignedPercent(row.original.returnPercent)}
          </span>
        ),
      },
      {
        id: 'pnl',
        header: 'Profit or loss',
        accessorFn: (trade) => Number(trade.pnlAmount),
        meta: { align: 'end', label: 'Profit or loss' },
        cell: ({ row }) => {
          const value = Number(row.original.pnlAmount);
          return (
            <span className={value >= 0 ? styles.positive : styles.negative}>
              {value >= 0 ? '+' : ''}
              {value.toLocaleString('en')}
            </span>
          );
        },
      },
    ],
    [],
  );

  if (trades.data === undefined) {
    return trades.isError ? (
      <ErrorState
        title="Trades unavailable"
        message={trades.error.message}
        onRetry={() => {
          void trades.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={8} />
    );
  }

  const outliers = trades.data.filter((trade) => trade.isOutlier).length;
  return (
    <div className={styles.tabBody}>
      <div className={styles.inline}>
        <span className={styles.meta}>
          {pluralize(trades.data.length, 'trade')}
          {outliers > 0 ? ` · ${pluralize(outliers, 'outlier')}` : ''}
        </span>
        {outliers > 0 && (
          <label className={styles.checkOption}>
            <input
              type="checkbox"
              checked={onlyOutliers}
              onChange={(event) => {
                setOnlyOutliers(event.target.checked);
              }}
            />
            Show outlier trades only
          </label>
        )}
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={getRowId}
        ariaLabel="Backtest trades"
        pageSize={25}
      />
    </div>
  );
}
