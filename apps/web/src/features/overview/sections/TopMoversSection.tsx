import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useMarketSchedule } from '../../../providers/MarketScheduleProvider';
import { positionDetailPath } from '../../../routes/routes';
import { formatMoney } from '../../../shared/format';
import { selectMovers } from '../model/overviewLists';
import type { ValuedPosition } from '../model/overviewTypes';
import { formatSignedPercent } from '../overviewFormat';
import styles from './sections.module.scss';

export interface TopMoversSectionProps {
  readonly positions: readonly ValuedPosition[];
}

// Colour is never the only signal: every move shows an arrow and a sign (UI spec 4).
const ARROWS: Readonly<Record<ValuedPosition['direction'], string>> = {
  positive: '▲',
  negative: '▼',
  neutral: '■',
};

export function TopMoversSection({ positions }: TopMoversSectionProps): ReactElement {
  const { marketStatuses } = useMarketSchedule();
  const closedMarkets = new Set<string>(
    marketStatuses
      .filter((status) => status.state === 'closed' || status.state === 'holiday')
      .map((status) => status.marketId),
  );
  const { gainers, losers } = selectMovers(positions);

  const renderRow = (position: ValuedPosition): ReactElement => (
    <li key={position.instrument.id} className={styles.row}>
      <span className={styles.rowMain}>
        <Link
          to={positionDetailPath(position.instrument.id)}
          className={`${styles.rowTitle} ${styles.link}`}
        >
          {position.instrument.symbol}
        </Link>
        <span className={styles.meta}>
          {position.instrument.name}
          {closedMarkets.has(position.instrument.marketId) ? ' · Market closed, last price' : ''}
        </span>
      </span>
      <span className={styles.rowValue}>
        <span className={styles[position.direction]}>
          {ARROWS[position.direction]} {formatSignedPercent(position.changePercent)}
        </span>
        <span className={styles.meta}>
          {formatMoney(position.lastPrice, { showCurrency: 'code' })}
        </span>
      </span>
    </li>
  );

  return (
    <Card title="Top movers today">
      <div className={styles.columns}>
        <div>
          <h4 className={styles.subheading}>Gainers</h4>
          {gainers.length === 0 ? (
            <p className={styles.note}>No holdings are up today.</p>
          ) : (
            <ul className={styles.list}>{gainers.map(renderRow)}</ul>
          )}
        </div>
        <div>
          <h4 className={styles.subheading}>Losers</h4>
          {losers.length === 0 ? (
            <p className={styles.note}>No holdings are down today.</p>
          ) : (
            <ul className={styles.list}>{losers.map(renderRow)}</ul>
          )}
        </div>
      </div>
    </Card>
  );
}
