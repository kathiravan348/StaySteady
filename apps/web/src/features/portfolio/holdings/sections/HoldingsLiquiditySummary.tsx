// How much of the portfolio could become cash within days, weeks or months (E-01; requirements 30;
// UI spec 19.2). Traded portfolio only (decision 44): each position's class comes from its row.

import type { ReactElement } from 'react';
import { Decimal } from 'decimal.js';

import { formatMoney } from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import type { LiquidityClass } from '../../../../shared/liquidity/liquidityClass';
import { LIQUIDITY_LABEL } from '../../../../shared/liquidity/liquidityClass';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import styles from '../HoldingsPage.module.scss';
import type { HoldingRow } from '../model/holdingTypes';

export interface HoldingsLiquiditySummaryProps {
  readonly rows: readonly HoldingRow[];
  readonly baseCurrency: BaseCurrencyCode;
}

const CLASSES: readonly LiquidityClass[] = ['days', 'weeks', 'months'];

export function HoldingsLiquiditySummary({
  rows,
  baseCurrency,
}: HoldingsLiquiditySummaryProps): ReactElement {
  const total = rows.reduce((sum, row) => sum.plus(row.valueBase.amount), new Decimal(0));

  return (
    <section className={styles.liquidityBar} aria-label="Liquidity">
      <span className={styles.liquidityLabel}>Could become cash within</span>
      <div className={styles.liquidityGrid}>
        {CLASSES.map((liquidityClass) => {
          const held = rows.filter((row) => row.liquidity.liquidityClass === liquidityClass);
          const value = held.reduce((sum, row) => sum.plus(row.valueBase.amount), new Decimal(0));
          return (
            <div key={liquidityClass} className={styles.liquidityCard}>
              <span className={styles.liquidityLabel}>{LIQUIDITY_LABEL[liquidityClass]}</span>
              <span className={styles.liquidityValue}>
                {formatMoney(createMoney(value, baseCurrency))}
              </span>
              <span className={styles.liquiditySub}>
                {total.isZero()
                  ? 'Nothing held'
                  : `${value.dividedBy(total).times(100).toFixed(1)}% of holdings · ${String(held.length)} ${held.length === 1 ? 'position' : 'positions'}`}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
