import { Badge } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api';
import { formatIsoDate, formatMoney, humanizeToken } from '../../../../shared/format';
import { ROUTES, positionDetailPath, strategyEditorPath } from '../../../../routes/routes';
import type { PositionRow } from '../model/positionRows';
import styles from '../Positions.module.scss';

const STAGE_TEXT: Readonly<Record<PositionRow['exitHandling'], string>> = {
  automatic:
    'The strategy is fully automatic: when the price reaches the stop it places the exit order itself.',
  approval:
    'The strategy is semi-automatic: it proposes the exit and waits in the approval queue. An unanswered proposal leaves the position open.',
  none: 'The strategy is not trading at this stage: it records what it would do and places nothing. If the stop is reached, exit by hand.',
};

function Item({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactElement | string;
}): ReactElement {
  return (
    <span className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{children}</span>
    </span>
  );
}

export function PositionDetail({ row }: { readonly row: PositionRow }): ReactElement {
  const tone = (negative: boolean): string | undefined =>
    negative ? styles.negative : styles.positive;
  return (
    <div className={styles.detail}>
      <div className={styles.stack}>
        <h3 className={styles.sectionTitle}>
          {row.strategy.name} · version {row.strategy.version} · {humanizeToken(row.strategy.stage)}
        </h3>
        <p className={styles.note}>{STAGE_TEXT[row.exitHandling]}</p>
        <p className={styles.note}>{row.strategy.description}</p>
        {row.rules.length > 0 && (
          <ul className={styles.list} aria-label="Strategy rules">
            {row.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.detailGrid}>
        <Item label="Opened">{`${row.openedOn === null ? 'Unknown' : formatIsoDate(row.openedOn)} (${String(row.lotCount)} ${row.lotCount === 1 ? 'purchase' : 'purchases'})`}</Item>
        <Item label="Broker">{row.brokerName}</Item>
        <Item label="Average cost">{formatMoney(row.averageCost)}</Item>
        <Item label="Last price">{formatMoney(row.lastPrice)}</Item>
        <Item label="Stop">{row.stop === null ? 'None set' : formatMoney(row.stop)}</Item>
        <Item label="Result if closed at the stop">
          {row.resultAtStop === null ? (
            '—'
          ) : (
            <span className={tone(row.resultAtStop.amount.isNegative())}>
              {formatMoney(row.resultAtStop, { signed: true })}
            </span>
          )}
        </Item>
        <Item label="Profit target">
          {row.strategy.parameters['profitTargetPct'] === undefined
            ? 'None: exits on its stop or a signal'
            : `+${String(row.strategy.parameters['profitTargetPct'])}% from entry`}
        </Item>
      </div>

      <div className={styles.stack}>
        <h3 className={styles.sectionTitle}>Orders still working in {row.instrument.symbol}</h3>
        {row.workingOrders.length === 0 ? (
          <p className={styles.note}>None.</p>
        ) : (
          <ul className={styles.list}>
            {row.workingOrders.map((order) => (
              <li key={order.orderId}>
                <span className={styles.inline}>
                  {humanizeToken(order.side)} {order.quantity}
                  {order.requestedPrice === null
                    ? ' at market'
                    : ` at ${formatMoney(moneyFromDto(order.requestedPrice))}`}{' '}
                  — {order.strategyName ?? 'placed by hand'}
                  <Badge variant={order.status === 'unconfirmed' ? 'critical' : 'info'}>
                    {order.status === 'unconfirmed'
                      ? 'Unconfirmed: may be live'
                      : order.timeline.at(-1)?.kind === 'approval_requested'
                        ? 'Awaiting approval'
                        : humanizeToken(order.status)}
                  </Badge>
                  {order.isSimulated && <Badge variant="neutral">Simulated</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className={styles.inline}>
        <Link className={styles.link} to={positionDetailPath(String(row.instrument.id))}>
          Position detail
        </Link>
        <Link className={styles.link} to={strategyEditorPath(String(row.strategy.id))}>
          Strategy
        </Link>
        <Link className={styles.link} to={ROUTES.TRADING_ORDERS}>
          Orders
        </Link>
        <Link className={styles.link} to={ROUTES.TRADING_APPROVALS}>
          Approvals
        </Link>
      </span>
    </div>
  );
}
