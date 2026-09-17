// Historical record of refusals at signal stage for S-33 (requirements 27; UI spec 19.1).

import type { FC } from 'react';
import { Badge, Card } from '@staysteady/ui';

import type { RefusalRecord } from '../../../data/schemas/compliance';
import styles from '../Compliance.module.scss';

export interface RefusalsLogSectionProps {
  readonly refusals: readonly RefusalRecord[];
}

export const RefusalsLogSection: FC<RefusalsLogSectionProps> = ({ refusals }) => {
  return (
    <Card title="Signal Refusals & Audit Log">
      <div className={styles.stack}>
        <p className={styles.bannerSubtext}>
          Immutable record of blocked trades. Violations are intercepted in the safety layer at
          signal stage, guaranteeing orders never reach a broker or exchange.
        </p>

        {refusals.length === 0 ? (
          <p className={styles.bannerSubtext}>No refusals recorded.</p>
        ) : (
          <ul className={styles.list}>
            {refusals.map((r) => (
              <li key={r.id} className={styles.item}>
                <div className={styles.inlineBetween}>
                  <div className={styles.inline}>
                    <Badge variant="critical">
                      REFUSED: {r.action} {r.symbol}
                    </Badge>
                    <Badge variant="neutral">{r.source.replace('_', ' ')}</Badge>
                    {r.strategyName && <Badge variant="info">Strategy: {r.strategyName}</Badge>}
                    <Badge variant="positive">SIGNAL STAGE INTERCEPT</Badge>
                  </div>
                  <span className={styles.fieldLabel}>
                    {r.timestamp.replace('T', ' ').slice(0, 16)} UTC
                  </span>
                </div>

                <div className={styles.inlineBetween}>
                  <span className={styles.bannerText}>{r.ruleViolated}</span>
                  <Badge variant="neutral">{r.policyClause}</Badge>
                </div>

                <p className={styles.bannerSubtext}>{r.refusalReason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};
