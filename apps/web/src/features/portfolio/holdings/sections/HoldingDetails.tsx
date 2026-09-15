import { Sparkline } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { usePriceHistories } from '../../../../data/api';
import { formatMoney, formatNumber, pluralize } from '../../../../shared/format';
import styles from '../HoldingsPage.module.scss';
import type { HoldingRow } from '../model/holdingTypes';
import { TaxStatusBadge } from './TaxStatusBadge';

export interface HoldingDetailsProps {
  readonly row: HoldingRow;
}

const TREND_BARS = 90;

// UI spec 7.2 — row expansion: a small price sparkline and the individual purchase lots.
export function HoldingDetails({ row }: HoldingDetailsProps): ReactElement {
  const { instrument } = row;
  const ids = useMemo(() => [instrument.id], [instrument.id]);
  const prices = usePriceHistories(ids);
  const closes = useMemo(
    () =>
      (prices.histories.get(instrument.id) ?? [])
        .slice(-TREND_BARS)
        .map((bar) => Number(bar.close)),
    [prices.histories, instrument.id],
  );

  const trend =
    prices.error !== null ? (
      <span className={styles.meta}>Price history unavailable</span>
    ) : closes.length < 2 ? (
      <span className={styles.meta}>Loading price history…</span>
    ) : (
      <Sparkline
        data={closes}
        width={220}
        height={48}
        showArea
        role="img"
        aria-label={`${instrument.symbol} closing prices over the last ${TREND_BARS} trading days`}
      />
    );

  return (
    <div className={styles.details}>
      <div className={styles.detailsBlock}>
        <span className={styles.detailsLabel}>Last {TREND_BARS} trading days</span>
        {trend}
      </div>
      <div className={styles.detailsBlock}>
        <span className={styles.detailsLabel}>Purchase lots</span>
        <table className={styles.lotsTable} aria-label={`Purchase lots for ${instrument.symbol}`}>
          <thead>
            <tr>
              <th scope="col" className={styles.lotsHeader}>
                Purchased
              </th>
              <th scope="col" className={`${styles.lotsHeader} ${styles.lotsNumeric}`}>
                Quantity
              </th>
              <th scope="col" className={`${styles.lotsHeader} ${styles.lotsNumeric}`}>
                Cost per unit
              </th>
              <th scope="col" className={`${styles.lotsHeader} ${styles.lotsNumeric}`}>
                Held
              </th>
              <th scope="col" className={styles.lotsHeader}>
                Tax status
              </th>
            </tr>
          </thead>
          <tbody>
            {row.lots.map((lot) => (
              <tr key={lot.id}>
                <td className={styles.lotsCell}>{lot.purchaseDate}</td>
                <td className={`${styles.lotsCell} ${styles.lotsNumeric}`}>
                  {formatNumber(lot.quantity, { decimals: Number.isInteger(lot.quantity) ? 0 : 4 })}
                </td>
                <td className={`${styles.lotsCell} ${styles.lotsNumeric}`}>
                  {formatMoney(lot.costPerUnit, { showCurrency: 'code' })}
                </td>
                <td className={`${styles.lotsCell} ${styles.lotsNumeric}`}>
                  {pluralize(lot.daysHeld, 'day')}
                </td>
                <td className={styles.lotsCell}>
                  <TaxStatusBadge status={lot.tax} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
