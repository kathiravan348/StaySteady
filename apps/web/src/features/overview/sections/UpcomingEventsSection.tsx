import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useCalendarEvents } from '../../../data/api';
import { ROUTES } from '../../../routes/routes';
import { formatIsoDate } from '../../../shared/format';
import { humanizeToken, selectUpcomingEvents } from '../model/overviewLists';
import styles from './sections.module.scss';

export interface UpcomingEventsSectionProps {
  readonly heldMarketIds: ReadonlySet<string>;
}

// UI spec 7.1 side area. Calendar events are market-wide, so events for markets you hold are shown.
export function UpcomingEventsSection({ heldMarketIds }: UpcomingEventsSectionProps): ReactElement {
  const events = useCalendarEvents();
  const today = new Date().toISOString().slice(0, 10);
  const items = useMemo(
    () => selectUpcomingEvents(events.data ?? [], heldMarketIds, today),
    [events.data, heldMarketIds, today],
  );

  const body = events.isError ? (
    <ErrorState
      title="Calendar unavailable"
      message={events.error.message}
      onRetry={() => {
        void events.refetch();
      }}
    />
  ) : events.isPending ? (
    <LoadingState layout="table" count={3} />
  ) : items.length === 0 ? (
    <p className={styles.note}>No upcoming events for the markets you hold.</p>
  ) : (
    <ul className={styles.list}>
      {items.map((event) => (
        <li key={event.id} className={styles.stackedRow}>
          <span className={styles.wrappingTitle}>{event.title}</span>
          <span className={styles.meta}>
            {formatIsoDate(event.date)} · {event.marketId} market
          </span>
          <span className={styles.badges}>
            <Badge variant={event.impact === 'high' ? 'warning' : 'neutral'}>
              {humanizeToken(event.impact)} impact
            </Badge>
            {event.inTradingRestrictionWindow && (
              <Badge variant="critical">Automation restricted</Badge>
            )}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <Card
      title="Upcoming events"
      extra={
        <Link to={ROUTES.NEWS_CALENDAR} className={styles.link}>
          Calendar
        </Link>
      }
    >
      {body}
    </Card>
  );
}
