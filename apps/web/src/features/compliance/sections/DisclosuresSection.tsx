// Personal disclosure obligations register for S-33 (requirements 27; UI spec 19.1).

import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

import type { DisclosureObligation } from '../../../data/schemas/compliance';
import { getDisclosureStatusBadge } from '../model/complianceLabels';
import styles from '../Compliance.module.scss';

export interface DisclosuresSectionProps {
  readonly disclosures: readonly DisclosureObligation[];
}

export const DisclosuresSection: FC<DisclosuresSectionProps> = ({ disclosures }) => {
  return (
    <Card title="Personal Disclosure Obligations & Reminders">
      <div className={styles.stack}>
        <p className={styles.bannerSubtext}>
          Statutory and employer reporting obligations. Reminders trigger prior to filing deadlines
          to prevent reporting non-compliance.
        </p>

        <ul className={styles.list}>
          {disclosures.map((d) => {
            const statusInfo = getDisclosureStatusBadge(d.status);
            return (
              <li key={d.id} className={styles.item}>
                <div className={styles.inlineBetween}>
                  <div className={styles.inline}>
                    <span className={styles.bannerText}>{d.title}</span>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    <Badge variant="neutral">{d.frequency}</Badge>
                    <Badge variant="neutral">{d.jurisdiction}</Badge>
                  </div>
                  <span className={styles.fieldLabel}>Recipient: {d.recipient}</span>
                </div>

                <div className={styles.inlineBetween}>
                  <span className={styles.bannerSubtext}>
                    Deadline: <strong>{d.nextDeadline.slice(0, 10)}</strong>
                  </span>
                  <span className={styles.bannerSubtext}>
                    {d.daysUntilDeadline > 0
                      ? `${d.daysUntilDeadline} days until filing deadline`
                      : d.status === 'SUBMITTED'
                        ? 'Filing completed on schedule'
                        : `${Math.abs(d.daysUntilDeadline)} days past statutory deadline`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
};
