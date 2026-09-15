import { Sparkline } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { usePriceHistories } from '../../../../data/api';
import styles from '../HoldingsPage.module.scss';
import type { HoldingRow } from '../model/holdingTypes';
import { LotsTable } from './LotsTable';

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
        <LotsTable lots={row.lots} symbol={instrument.symbol} />
      </div>
    </div>
  );
}
