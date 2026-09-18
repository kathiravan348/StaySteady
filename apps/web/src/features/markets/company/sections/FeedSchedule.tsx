// What is scheduled ahead for this instrument (requirements 38): results, board meetings and
// ex-dates as a strip, each marked when it falls inside an automation restriction window, and the
// next trading blackout that applies to it under the employer policy.

import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { InstrumentFeedDto } from '../../../../data/schemas';
import { formatIsoDate, humanizeToken } from '../../../../shared/format';
import styles from '../CompanyResearch.module.scss';

const DAY_MS = 86_400_000;

function daysUntil(date: string, asOf: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`)) / DAY_MS);
}

export function FeedSchedule({ feed }: { readonly feed: InstrumentFeedDto }): ReactElement {
  const window = feed.nextRestrictionWindow;
  return (
    <Card title="Scheduled ahead">
      <div className={styles.stack}>
        {feed.upcomingEvents.length === 0 ? (
          <p className={styles.description}>
            Nothing is scheduled for this instrument yet. Results dates are usually announced two to
            three weeks ahead.
          </p>
        ) : (
          <ol className={styles.eventStrip} aria-label="Scheduled events, soonest first">
            {feed.upcomingEvents.map((event) => {
              const days = daysUntil(event.date, feed.asOf);
              return (
                <li key={event.id} className={styles.flag}>
                  <span className={styles.inline}>
                    <strong>{formatIsoDate(event.date)}</strong>
                    <span className={styles.meta}>
                      {days === 0 ? 'today' : `in ${String(days)} days`}
                    </span>
                  </span>
                  <span>{event.title}</span>
                  <span className={styles.inline}>
                    <Badge variant="neutral">{humanizeToken(event.eventType)}</Badge>
                    {event.inTradingRestrictionWindow && (
                      <Badge variant="warning">Inside an automation restriction window</Badge>
                    )}
                  </span>
                  {event.description !== undefined && (
                    <span className={styles.meta}>{event.description}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <span className={styles.evidence}>
          {window === null
            ? 'No trading blackout applies to this instrument under the employer policy.'
            : window.isActive
              ? `Trading blackout in force: ${window.name}, until ${formatIsoDate(window.endDate)}.`
              : `Next trading blackout: ${window.name}, from ${formatIsoDate(window.startDate)} to ${formatIsoDate(window.endDate)}.`}
        </span>
      </div>
    </Card>
  );
}
