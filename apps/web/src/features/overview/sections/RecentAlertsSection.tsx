import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAlerts } from '../../../data/api';
import type { SeverityDto } from '../../../data/schemas';
import { ROUTES } from '../../../routes/routes';
import { formatRelativeTime } from '../../../shared/format';
import { humanizeToken } from '../model/overviewLists';
import styles from './sections.module.scss';

const RECENT_ALERT_COUNT = 4;

// Requirements 11 severity tiers; critical stays distinct from warnings (UI spec 4).
const SEVERITY_BADGE: Readonly<Record<SeverityDto, BadgeVariant>> = {
  critical: 'critical',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export function RecentAlertsSection(): ReactElement {
  const alerts = useAlerts();
  const items = useMemo(
    () =>
      [...(alerts.data ?? [])]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, RECENT_ALERT_COUNT),
    [alerts.data],
  );

  const body = alerts.isError ? (
    <ErrorState
      title="Alerts unavailable"
      message={alerts.error.message}
      onRetry={() => {
        void alerts.refetch();
      }}
    />
  ) : alerts.isPending ? (
    <LoadingState layout="table" count={3} />
  ) : items.length === 0 ? (
    <p className={styles.note}>No recent alerts.</p>
  ) : (
    <ul className={styles.list}>
      {items.map((alert) => (
        <li key={alert.id} className={styles.stackedRow}>
          <span className={styles.wrappingTitle}>{alert.title}</span>
          <span className={styles.meta}>
            {alert.source} · {formatRelativeTime(alert.timestamp)}
          </span>
          <span className={styles.badges}>
            <Badge variant={SEVERITY_BADGE[alert.severity]}>
              {humanizeToken(alert.severity)} severity
            </Badge>
            {!alert.acknowledged && <Badge variant="neutral">Unacknowledged</Badge>}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <Card
      title="Recent alerts"
      extra={
        <Link to={ROUTES.ALERTS} className={styles.link}>
          All alerts
        </Link>
      }
    >
      {body}
    </Card>
  );
}
