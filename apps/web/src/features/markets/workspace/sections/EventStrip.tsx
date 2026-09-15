import { Badge } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { formatIsoDate, humanizeToken } from '../../../../shared/format';
import { toIsoDate } from '../../../../shared/types/dateTime';
import type { ChartEvent } from '../model/chartEvents';
import styles from '../WorkspacePage.module.scss';

export interface EventStripProps {
  readonly events: readonly ChartEvent[];
  readonly today: string;
}

// UI spec 7.4 bottom detail strip: the events marked on the chart, as text, plus upcoming ones.
export function EventStrip({ events, today }: EventStripProps): ReactElement {
  return (
    <section className={styles.eventStrip} aria-label="Instrument events">
      <h2 className={styles.stripTitle}>Events</h2>
      {events.length === 0 ? (
        <p className={styles.note}>No dividends, splits, earnings or high-impact news recorded.</p>
      ) : (
        <ol className={styles.eventList}>
          {[...events].reverse().map((event) => (
            <li key={event.id} className={styles.eventItem}>
              <span className={styles.badges}>
                <Badge variant={event.kind === 'news' ? 'warning' : 'neutral'}>
                  {humanizeToken(event.label)}
                </Badge>
                {event.date >= today && <Badge variant="info">Upcoming</Badge>}
              </span>
              <span className={styles.meta}>{formatIsoDate(toIsoDate(event.date))}</span>
              <span className={styles.wrapText}>{event.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
