import type { ReactElement } from 'react';

import { formatMoney, formatNumber, pluralize } from '../../../../shared/format';
import styles from '../HoldingsPage.module.scss';
import type { LotView } from '../model/holdingTypes';
import { TaxStatusBadge } from './TaxStatusBadge';

export interface LotsTableProps {
  readonly lots: readonly LotView[];
  readonly symbol: string;
}

// Purchase lots with individual holding periods (UI spec 7.2 row expansion and 7.3).
export function LotsTable({ lots, symbol }: LotsTableProps): ReactElement {
  return (
    <table className={styles.lotsTable} aria-label={`Purchase lots for ${symbol}`}>
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
        {lots.map((lot) => (
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
  );
}
