import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { RecoveryLocationDto } from '../../../data/schemas/continuity';
import styles from '../Continuity.module.scss';

export function RecoveryLocations({
  locations,
}: {
  readonly locations: readonly RecoveryLocationDto[];
}): ReactElement {
  return (
    <Card title="Recovery Material & Custody Points" isCollapsible defaultExpanded>
      <p className={styles.note}>
        Describes where emergency instructions, physical backup tokens, and executor memos are kept,
        <strong> without containing any credentials or secret keys</strong>. Re-audit periodically
        to ensure physical materials and access permissions remain valid.
      </p>

      <ul className={styles.list} aria-label="Recovery Material Locations">
        {locations.map((loc) => (
          <li key={loc.id} className={`${styles.item} ${loc.isOverdue ? styles.overdueItem : ''}`}>
            <div className={styles.inline}>
              <span className={styles.title}>{loc.title}</span>
              <Badge variant="neutral">{loc.custodyMethod}</Badge>
              {loc.isOverdue && <Badge variant="warning">Audit Overdue</Badge>}
            </div>

            <p className={styles.note}>{loc.storageDescription}</p>

            <div className={styles.actionRow}>
              <span className={styles.meta}>
                Last physical/access audit: {loc.lastAuditedDate.slice(0, 10)} ({loc.daysSinceAudit}{' '}
                days ago — audit every {loc.auditPeriodDays} days)
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
