import { Sparkline } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { workspaceTickerPath } from '../../../../routes/routes';
import {
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercent,
} from '../../../../shared/format';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { WatchlistRow } from '../model/watchlistRows';
import styles from '../Watchlists.module.scss';

export interface WatchlistRowViewProps {
  readonly row: WatchlistRow;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly canMoveToOtherList: boolean;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onMoveToList: () => void;
  readonly onRemove: () => void;
}

const ARROWS = { positive: '▲', negative: '▼', neutral: '■' } as const;

const STATE_NOTE: Readonly<Record<MarketSessionState, string | null>> = {
  open: null,
  'pre-open': 'Pre-open',
  'post-close': 'After hours',
  closed: 'Closed, last price',
  holiday: 'Holiday, last price',
};

// One compact quote row: identity, market, live price and move, day range, volume, trend, actions.
export function WatchlistRowView(props: WatchlistRowViewProps): ReactElement {
  const { row } = props;
  const { symbol } = row.instrument;
  const code = { showCurrency: 'code' } as const;
  const note = row.marketState === null ? null : STATE_NOTE[row.marketState];
  const first = row.closes[0];
  const last = row.closes[row.closes.length - 1];
  const trendPercent =
    first === undefined || last === undefined || first === 0
      ? null
      : ((last - first) / first) * 100;

  return (
    <div className={styles.row}>
      <span className={styles.stack}>
        <Link to={workspaceTickerPath(symbol)} className={styles.symbolLink}>
          {symbol}
        </Link>
        <span className={styles.meta}>{row.instrument.name}</span>
      </span>
      <span className={styles.stack}>
        <span>{row.marketName}</span>
        <span className={styles.meta}>{note ?? row.typeLabel}</span>
      </span>
      <span className={styles.numeric}>
        <span className={styles.visuallyHidden}>Price </span>
        {row.lastPrice === null ? '—' : formatMoney(row.lastPrice, code)}
      </span>
      <span className={`${styles.numericStack} ${styles[row.direction]}`}>
        <span className={styles.visuallyHidden}>Change today </span>
        <span>
          {ARROWS[row.direction]}{' '}
          {row.changePercent === null ? '—' : formatSignedPercent(row.changePercent)}
        </span>
        <span className={styles.meta}>
          {row.change === null ? '' : formatSignedMoney(row.change)}
        </span>
      </span>
      <span className={`${styles.numericStack} ${styles.optional}`}>
        <span className={styles.meta}>Day range</span>
        <span>
          {row.dayLow === null || row.dayHigh === null
            ? '—'
            : `${formatMoney(row.dayLow, code)} – ${formatMoney(row.dayHigh, code)}`}
        </span>
      </span>
      <span className={`${styles.numericStack} ${styles.optional}`}>
        <span className={styles.meta}>Volume</span>
        <span>{row.volume === null ? '—' : formatNumber(row.volume, { decimals: 0 })}</span>
      </span>
      <span className={styles.trend}>
        {row.closes.length < 2 || trendPercent === null ? (
          <span className={styles.meta}>No trend</span>
        ) : (
          <Sparkline
            data={row.closes}
            width={88}
            height={26}
            direction={trendPercent > 0 ? 'positive' : trendPercent < 0 ? 'negative' : 'neutral'}
            role="img"
            aria-label={`${symbol} ${row.closes.length}-day trend ${formatSignedPercent(Math.round(trendPercent * 100) / 100)}`}
          />
        )}
      </span>
      <span className={styles.rowActions}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Move ${symbol} up`}
          disabled={props.isFirst}
          onClick={props.onMoveUp}
        >
          ↑
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Move ${symbol} down`}
          disabled={props.isLast}
          onClick={props.onMoveDown}
        >
          ↓
        </button>
        <button
          type="button"
          className={styles.textButton}
          disabled={!props.canMoveToOtherList}
          onClick={props.onMoveToList}
        >
          Move…
        </button>
        <button
          type="button"
          className={styles.textButton}
          aria-label={`Remove ${symbol}`}
          onClick={props.onRemove}
        >
          Remove
        </button>
      </span>
    </div>
  );
}
