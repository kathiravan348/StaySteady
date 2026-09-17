// Compliance limits beside the risk limits, since the same safety layer enforces both (E-04;
// requirements 27, 32; UI spec 19.2). Figures come from the compliance record.

import { Badge, Card, ErrorState, LoadingState, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useCompliance } from '../../../data/api';
import { ROUTES } from '../../../routes/routes';
import riskStyles from '../Risk.module.scss';
import styles from './RiskPanels.module.scss';

export function ComplianceLimitsPanel(): ReactElement {
  const compliance = useCompliance();

  const body = ((): ReactElement => {
    if (compliance.isError) {
      return (
        <ErrorState
          title="Compliance limits unavailable"
          message={compliance.error.message}
          onRetry={() => {
            void compliance.refetch();
          }}
        />
      );
    }
    if (compliance.data === undefined) return <LoadingState layout="cards" count={4} />;
    const { blackoutWindows, restrictedInstruments, holdingLocks, refusals } = compliance.data;
    const active = blackoutWindows.filter((window) => window.status === 'ACTIVE');
    const locked = holdingLocks.filter((lock) => lock.daysRemaining > 0);
    return (
      <div className={styles.grid}>
        <div className={cx(styles.fact, active.length > 0 ? styles.alert : undefined)}>
          <div className={styles.head}>
            <span className={styles.name}>Blackout windows</span>
            <Badge variant={active.length > 0 ? 'warning' : 'positive'}>
              {active.length > 0 ? `${String(active.length)} active` : 'None active'}
            </Badge>
          </div>
          <p className={styles.text}>
            {active.length > 0
              ? active
                  .map((window) => `${window.name} (${String(window.daysRemaining)} days left)`)
                  .join('; ')
              : 'Trading is not paused by any window.'}
          </p>
        </div>
        <div className={styles.fact}>
          <div className={styles.head}>
            <span className={styles.name}>Restricted instruments</span>
            <Badge variant="neutral">{restrictedInstruments.length}</Badge>
          </div>
          <p className={styles.text}>Refused for manual and automated trades alike.</p>
        </div>
        <div className={styles.fact}>
          <div className={styles.head}>
            <span className={styles.name}>Minimum holding locks</span>
            <Badge variant="neutral">{locked.length}</Badge>
          </div>
          <p className={styles.text}>
            {locked.length > 0
              ? `Lots that cannot be sold yet: ${locked.map((lock) => lock.symbol).join(', ')}.`
              : 'No lot is locked.'}
          </p>
        </div>
        <div className={styles.fact}>
          <div className={styles.head}>
            <span className={styles.name}>Refused at signal stage</span>
            <Badge variant="info">{refusals.length}</Badge>
          </div>
          <p className={styles.text}>Stopped before an order was created, each with its reason.</p>
        </div>
      </div>
    );
  })();

  return (
    <Card
      title="Compliance limits"
      extra={
        <Link to={ROUTES.COMPLIANCE} className={riskStyles.link}>
          Open compliance
        </Link>
      }
    >
      <div className={styles.stack}>
        <p className={styles.meta}>
          Enforced by the same safety layer as the risk limits below: a refused trade never becomes
          an order.
        </p>
        {body}
      </div>
    </Card>
  );
}
