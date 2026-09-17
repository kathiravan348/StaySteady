// Minimum holding period lock tracking for S-33 (requirements 27; UI spec 19.1).

import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

import type { HoldingPeriodLock } from '../../../data/schemas/compliance';
import styles from '../Compliance.module.scss';

export interface MinimumHoldingSectionProps {
  readonly locks: readonly HoldingPeriodLock[];
}

export const MinimumHoldingSection: FC<MinimumHoldingSectionProps> = ({ locks }) => {
  return (
    <Card title="Minimum Holding Periods & Anti-Round-Trip Locks">
      <div className={styles.stack}>
        <p className={styles.bannerSubtext}>
          Policy-mandated minimum holding periods preventing speculative round trips. Positions
          cannot be disposed of until the holding lock period expires.
        </p>

        {locks.length === 0 ? (
          <p className={styles.bannerSubtext}>No lots currently subject to holding period locks.</p>
        ) : (
          <ul className={styles.list}>
            {locks.map((lock) => (
              <li key={lock.id} className={styles.item}>
                <div className={styles.inlineBetween}>
                  <div className={styles.inline}>
                    <span className={styles.bannerText}>
                      {lock.symbol} — {lock.instrumentName}
                    </span>
                    <Badge variant="warning">{lock.daysRemaining} Days Locked</Badge>
                    <Badge variant="neutral">Qty: {lock.quantity}</Badge>
                    <Badge variant="neutral">{lock.minimumHoldingDays}-Day Rule</Badge>
                  </div>
                  <span className={styles.fieldLabel}>Lot: {lock.lotId}</span>
                </div>

                <div className={styles.inlineBetween}>
                  <span className={styles.bannerSubtext}>
                    Acquired: {lock.acquisitionDate.slice(0, 10)} | Unlocks:{' '}
                    <strong>{lock.unlockDate.slice(0, 10)}</strong>
                  </span>
                  <span className={styles.fieldLabel}>{lock.ruleReference}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};
