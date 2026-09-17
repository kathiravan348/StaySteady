// Compliance banner and policy status cards for S-33 (requirements 27; UI spec 19.1, 19.3).

import type { FC } from 'react';
import { Badge, Button, Card } from '@staysteady/ui';

import type { CompliancePolicyOverview } from '../../../data/schemas/compliance';
import styles from '../Compliance.module.scss';

export interface ComplianceBannerProps {
  readonly overview: CompliancePolicyOverview;
  readonly onConfirmReview: () => void;
  readonly isConfirming: boolean;
}

export const ComplianceBanner: FC<ComplianceBannerProps> = ({
  overview,
  onConfirmReview,
  isConfirming,
}) => {
  return (
    <div className={styles.stack}>
      {overview.activeBlackoutCount > 0 && (
        <div className={`${styles.banner} ${styles.bannerCritical}`}>
          <div className={styles.stackTight}>
            <div className={styles.inline}>
              <Badge variant="critical">ACTIVE BLACKOUT ENFORCED</Badge>
              <p className={styles.bannerText}>
                {overview.activeBlackoutCount === 1
                  ? '1 active blackout window in effect'
                  : `${overview.activeBlackoutCount} active blackout windows in effect`}
              </p>
            </div>
            <p className={styles.bannerSubtext}>
              Automated signals and manual orders in blacked-out instruments are refused at signal
              stage and will not reach the broker.
            </p>
          </div>
        </div>
      )}

      {overview.isReviewOverdue && (
        <div className={`${styles.banner} ${styles.bannerWarning}`}>
          <div className={styles.stackTight}>
            <div className={styles.inline}>
              <Badge variant="warning">REVIEW OVERDUE</Badge>
              <p className={styles.bannerText}>
                One or more restricted instrument policies or regulatory checklists are past their
                annual review date.
              </p>
            </div>
            <p className={styles.bannerSubtext}>
              Review active mandates, audit client rosters, and cross-border restrictions to ensure
              continued compliance.
            </p>
          </div>
          <Button variant="secondary" size="sm" onPress={onConfirmReview} isDisabled={isConfirming}>
            {isConfirming ? 'Confirming...' : 'Confirm Policy Up to Date'}
          </Button>
        </div>
      )}

      <div className={styles.gridThree}>
        <Card title="Policy Framework">
          <div className={styles.stackTight}>
            <div className={styles.inlineBetween}>
              <span className={styles.fieldLabel}>Version</span>
              <Badge variant="neutral">{overview.policyVersion}</Badge>
            </div>
            <div className={styles.inlineBetween}>
              <span className={styles.fieldLabel}>Last Verified</span>
              <span className={styles.bannerText}>{overview.lastReviewedDate.slice(0, 10)}</span>
            </div>
            <div className={styles.inlineBetween}>
              <span className={styles.fieldLabel}>Next Review Due</span>
              <span className={styles.bannerText}>{overview.nextReviewDueDate.slice(0, 10)}</span>
            </div>
          </div>
        </Card>

        <Card title="Enforcement Safeguards">
          <div className={styles.stackTight}>
            <div className={styles.inlineBetween}>
              <span className={styles.fieldLabel}>Restricted Instruments</span>
              <Badge variant="critical">{overview.restrictedInstrumentsCount} Prohibited</Badge>
            </div>
            <div className={styles.inlineBetween}>
              <span className={styles.fieldLabel}>Active Holding Locks</span>
              <Badge variant="warning">{overview.activeLocksCount} Lots Locked</Badge>
            </div>
            <div className={styles.inlineBetween}>
              <span className={styles.fieldLabel}>Pre-Clearance</span>
              <Badge variant="info">Enforced at Signal Stage</Badge>
            </div>
          </div>
        </Card>

        <Card title="Safety Layer Governance">
          <div className={styles.stackTight}>
            <p className={styles.bannerSubtext}>
              Checks sit in the same safety layer as risk limits. Nothing bypasses them —
              restrictions apply identically to automated strategies and manual trades.
            </p>
            <div className={styles.inline}>
              <Badge variant="neutral">Zero Broker Spillover</Badge>
              <Badge variant="neutral">Audit Logged</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
