import { Badge, MetricDisplay } from '@staysteady/ui';
import type { ReactElement } from 'react';

import {
  directionOfNumber,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercent,
  humanizeToken,
  pluralize,
} from '../../../../shared/format';
import { describeTaxStatus } from '../../holdings/model/holdingTax';
import type { ExitInfo, HoldingRow } from '../../holdings/model/holdingTypes';
import styles from '../PositionPage.module.scss';

export interface PositionHeaderProps {
  readonly row: HoldingRow;
  readonly exit: ExitInfo | null;
  readonly isExitEdited: boolean;
}

// UI spec 7.3 header: identity, market, currency, current price and position summary.
export function PositionHeader({ row, exit, isExitEdited }: PositionHeaderProps): ReactElement {
  const { instrument } = row;
  const quantity = formatNumber(row.quantity, {
    decimals: Number.isInteger(row.quantity) ? 0 : 4,
  });

  return (
    <section className={styles.header} aria-label="Position summary">
      <div className={styles.badges}>
        <Badge variant="neutral">
          {row.marketName} ({instrument.marketId})
        </Badge>
        <Badge variant="neutral">{instrument.currency}</Badge>
        <Badge variant="neutral">{humanizeToken(instrument.type)}</Badge>
        <Badge variant="neutral">{row.brokerName}</Badge>
        <Badge variant={row.strategyId === null ? 'neutral' : 'info'}>
          {row.strategyId === null ? 'Opened manually' : `Strategy: ${row.strategyName}`}
        </Badge>
      </div>
      <div className={styles.metrics}>
        <MetricDisplay
          label="Price"
          value={formatMoney(row.lastPrice, { showCurrency: 'code' })}
          changeValue={formatSignedPercent(row.changePercent)}
          direction={row.direction}
          subLabel="Change today"
        />
        <MetricDisplay
          label={`Value (${row.valueBase.currency})`}
          value={formatMoney(row.valueBase)}
          subLabel={`${quantity} units, ${formatMoney(row.valueLocal, { showCurrency: 'code' })}`}
        />
        <MetricDisplay
          label="Unrealised gain or loss"
          value={formatSignedMoney(row.gainBase)}
          changeValue={formatSignedPercent(row.gainPercent)}
          direction={directionOfNumber(row.gainPercent)}
          subLabel={`Cost ${formatMoney(row.costBase)} at purchase-date exchange rates`}
        />
        <MetricDisplay
          label="Currency effect"
          value={formatSignedMoney(row.currencyEffectBase)}
          subLabel="Part of the gain or loss caused by exchange rates"
        />
        <MetricDisplay
          label="Portfolio weight"
          value={`${row.weightPercent.toFixed(1)}%`}
          subLabel={`Average cost ${formatMoney(row.averageCost, { showCurrency: 'code' })}`}
        />
        <MetricDisplay
          label="Held"
          value={pluralize(row.daysHeld, 'day')}
          subLabel={describeTaxStatus(row.tax)}
        />
        <MetricDisplay
          label={isExitEdited ? 'Exit level (adjusted)' : 'Exit level'}
          value={exit === null ? 'Not set' : formatMoney(exit.level, { showCurrency: 'code' })}
          subLabel={
            exit === null
              ? 'No protective exit'
              : `${exit.distancePercent.toFixed(1)}% below the price${
                  exit.proximity === 'near' ? ', near exit' : ''
                }`
          }
        />
      </div>
    </section>
  );
}
