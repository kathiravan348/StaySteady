import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { moneyFromDto } from '../../../../data/api';
import { formatMoney } from '../../../../shared/format';
import { positionDetailPath } from '../../../../routes/routes';
import type { TransactionRow } from '../model/transactionRows';
import { FUNDING_CURRENCY } from '../model/transactionRows';
import styles from '../Transactions.module.scss';

// Row detail: notes, fees and unit price, the day's rate, the conversion charge and the position.
export function TransactionDetail({ row }: { readonly row: TransactionRow }): ReactElement {
  const tx = row.transaction;
  return (
    <div className={styles.stack}>
      {tx.notes !== undefined && <p className={styles.note}>{tx.notes}</p>}
      <p className={styles.meta}>
        Fees {formatMoney(moneyFromDto(tx.fees))}
        {tx.unitPrice === undefined
          ? ''
          : ` · ${String(tx.quantity ?? '')} at ${formatMoney(moneyFromDto(tx.unitPrice))}`}
        {row.fxRate === null || row.cashEffect.currency === row.cashEffectBase?.currency
          ? ''
          : ` · 1 ${row.cashEffect.currency} = ${row.fxRate.toFixed(4)} ${row.cashEffectBase?.currency ?? ''} on ${row.date}`}
      </p>
      {row.conversionCharge !== null && (
        <p className={styles.note}>
          Bought in {row.cashEffect.currency}: money was converted from {FUNDING_CURRENCY}, with a
          conversion charge of {formatMoney(moneyFromDto(row.conversionCharge.netAmount))} booked
          the same day.
        </p>
      )}
      {row.holding !== undefined && (
        <Link className={styles.meta} to={positionDetailPath(row.holding.instrumentId)}>
          Open the {row.instrument?.symbol ?? ''} position
        </Link>
      )}
    </div>
  );
}
