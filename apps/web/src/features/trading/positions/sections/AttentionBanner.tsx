import type { ReactElement } from 'react';

import type { PositionRow } from '../model/positionRows';
import { attentionReason } from '../model/positionRows';
import styles from '../Positions.module.scss';

// Positions the owner has to act on: near a stop nobody will exit, or with an unconfirmed order.
export function AttentionBanner({
  rows,
}: {
  readonly rows: readonly PositionRow[];
}): ReactElement | null {
  const items = rows.flatMap((row) => {
    const reason = attentionReason(row);
    return reason === null ? [] : [{ row, reason }];
  });
  if (items.length === 0) return null;
  return (
    <div className={styles.alert} role="alert">
      <span className={styles.alertTitle}>
        {items.length === 1 ? '1 position needs you' : `${String(items.length)} positions need you`}
      </span>
      <ul className={styles.list}>
        {items.map(({ row, reason }) => (
          <li key={row.id}>
            {row.instrument.symbol}: {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
