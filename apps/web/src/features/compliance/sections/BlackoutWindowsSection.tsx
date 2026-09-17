// Blackout windows schedule and pre-clearance register for S-33 (requirements 27; UI spec 19.1).

import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

import type { BlackoutWindow } from '../../../data/schemas/compliance';
import { BLACKOUT_TYPE_LABELS, getBlackoutStatusBadge } from '../model/complianceLabels';
import styles from '../Compliance.module.scss';

export interface BlackoutWindowsSectionProps {
  readonly windows: readonly BlackoutWindow[];
}

export const BlackoutWindowsSection: FC<BlackoutWindowsSectionProps> = ({ windows }) => {
  return (
    <Card title="Blackout Windows & Trading Quiet Periods">
      <div className={styles.stack}>
        <p className={styles.bannerSubtext}>
          Scheduled corporate earnings blackout periods and ad-hoc deal quiet windows. Trades during
          active windows require committee pre-clearance or are strictly prohibited.
        </p>

        <ul className={styles.list}>
          {windows.map((w) => {
            const statusInfo = getBlackoutStatusBadge(w.status);
            return (
              <li
                key={w.id}
                className={`${styles.item} ${w.status === 'ACTIVE' ? styles.resultRefused : ''}`}
              >
                <div className={styles.inlineBetween}>
                  <div className={styles.inline}>
                    <span className={styles.bannerText}>{w.name}</span>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {w.status === 'ACTIVE' && (
                      <Badge variant="critical">{w.daysRemaining} Days Remaining</Badge>
                    )}
                    {w.preClearanceRequired && (
                      <Badge variant="warning">Pre-Clearance Mandatory</Badge>
                    )}
                  </div>
                  <Badge variant="neutral">{BLACKOUT_TYPE_LABELS[w.windowType]}</Badge>
                </div>

                <div className={styles.inlineBetween}>
                  <span className={styles.bannerSubtext}>
                    Scope: <strong>{w.scope}</strong>
                  </span>
                  <span className={styles.bannerSubtext}>
                    Window: {w.startDate.slice(0, 10)} to {w.endDate.slice(0, 10)}
                  </span>
                </div>

                <div className={styles.inlineBetween}>
                  <p className={styles.bannerSubtext}>{w.notes}</p>
                  <span className={styles.fieldLabel}>Ref: {w.policyReference}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
};
