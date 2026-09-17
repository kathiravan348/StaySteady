import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ContinuityViewDto } from '../../../data/schemas/continuity';
import { useResetHeartbeat } from '../../../data/api';
import styles from '../Continuity.module.scss';

export function ContinuityHeader({
  continuity,
}: {
  readonly continuity: ContinuityViewDto;
}): ReactElement {
  const resetHeartbeat = useResetHeartbeat();
  const { inactivity, overdueReviewsCount } = continuity;

  return (
    <div className={styles.stack}>
      {overdueReviewsCount > 0 && (
        <div className={`${styles.banner} ${styles.bannerWarning}`} role="alert">
          <div className={styles.inline}>
            <Badge variant="warning">Review overdue</Badge>
            <p className={styles.bannerText}>
              {overdueReviewsCount} verification{' '}
              {overdueReviewsCount === 1 ? 'item is' : 'items are'} past the configured review
              interval. Confirm nominee status or conduct an emergency drill to maintain continuity
              readiness.
            </p>
          </div>
        </div>
      )}

      <div className={styles.gridTwo}>
        <Card title="Inactivity & Fail-Safe Pause">
          <div className={styles.stack}>
            <div className={styles.inline}>
              <Badge variant={inactivity.isPaused ? 'critical' : 'positive'}>
                {inactivity.isPaused ? 'Automation Paused' : 'Automation Active'}
              </Badge>
              <span className={styles.meta}>
                Threshold: {inactivity.thresholdDays} days unattended
              </span>
            </div>

            <p className={styles.note}>
              {inactivity.isPaused
                ? 'Automation has paused fail-safe due to inactivity. Deliberate reactivation is required.'
                : `If you do not log in or confirm activity within the next ${String(
                    inactivity.daysUntilPause,
                  )} days, all automated trading and execution will pause fail-safe.`}
            </p>

            <div className={styles.actionRow}>
              <Button
                variant="secondary"
                isDisabled={resetHeartbeat.isPending}
                onPress={() => {
                  resetHeartbeat.mutate();
                }}
              >
                {resetHeartbeat.isPending ? 'Confirming...' : 'I am active today (Reset timer)'}
              </Button>
              <span className={styles.meta}>
                Last recorded activity: {inactivity.lastHeartbeatAt.slice(0, 10)} (
                {inactivity.inactiveDays} days ago)
              </span>
            </div>
          </div>
        </Card>

        <Card title="Emergency Access Principles">
          <div className={styles.stack}>
            <div className={styles.inline}>
              <Badge variant="neutral">Single Owner Protection</Badge>
              <Badge variant="info">Read-Only Separation</Badge>
            </div>
            <p className={styles.note}>
              If you become incapacitated or cannot be reached, your nominated person needs
              immediate visibility into assets and accounts, <strong>without</strong> granting live
              trading authorization. Access to information is strictly separable from ability to
              execute trades.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
