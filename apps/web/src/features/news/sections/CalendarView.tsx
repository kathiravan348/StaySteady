import { Button, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type { CalendarEventDto, InstrumentDto } from '../../../data/schemas';
import { ToggleGroup } from '../../../shared/ui/ToggleGroup';
import { humanizeToken } from '../../../shared/format';
import type { CalendarLayout } from '../model/calendarModel';
import {
  CALENDAR_LAYOUTS,
  WEEKDAY_LABELS,
  eventsByDate,
  isoDate,
  rangeLabel,
  shiftAnchor,
  visibleDays,
} from '../model/calendarModel';
import styles from '../News.module.scss';
import { CalendarEventItem } from './CalendarEventItem';

export interface CalendarViewProps {
  readonly events: readonly CalendarEventDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly heldIds: ReadonlySet<string>;
}

// UI spec 7.6 — month, week and day layouts of market events, with restriction windows marked and a
// held-instruments filter.
export function CalendarView({ events, instruments, heldIds }: CalendarViewProps): ReactElement {
  const today = isoDate(new Date());
  const [layout, setLayout] = useState<CalendarLayout>('month');
  const [anchor, setAnchor] = useState(today);
  const [heldOnly, setHeldOnly] = useState(false);

  const byDate = useMemo(
    () => eventsByDate(events, heldIds, heldOnly),
    [events, heldIds, heldOnly],
  );
  const byId = useMemo(
    () => new Map(instruments.map((instrument) => [String(instrument.id), instrument])),
    [instruments],
  );
  const days = visibleDays(anchor, layout);
  const shown = days.flatMap((day) => (day.inRange ? (byDate.get(day.date) ?? []) : []));
  const restricted = shown.filter((event) => event.inTradingRestrictionWindow).length;

  const item = (event: CalendarEventDto, isDetailed: boolean): ReactElement => {
    const id = event.instrumentId === undefined ? undefined : String(event.instrumentId);
    return (
      <CalendarEventItem
        key={event.id}
        event={event}
        instrument={id === undefined ? undefined : byId.get(id)}
        isHeld={id !== undefined && heldIds.has(id)}
        isDetailed={isDetailed}
      />
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <ToggleGroup
            label="Calendar layout"
            options={CALENDAR_LAYOUTS}
            value={layout}
            onChange={setLayout}
            formatOption={humanizeToken}
          />
          <Button
            variant="secondary"
            onPress={() => {
              setAnchor(shiftAnchor(anchor, layout, -1));
            }}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              setAnchor(today);
            }}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              setAnchor(shiftAnchor(anchor, layout, 1));
            }}
          >
            Next
          </Button>
          <strong className={styles.note} aria-live="polite">
            {rangeLabel(anchor, layout)}
          </strong>
        </span>
        <label className={styles.checkOption}>
          <input
            type="checkbox"
            checked={heldOnly}
            onChange={(event) => {
              setHeldOnly(event.target.checked);
            }}
          />
          Held instruments only
        </label>
      </div>

      <p className={styles.meta}>
        {shown.length} event{shown.length === 1 ? '' : 's'} in view
        {restricted > 0
          ? `, ${String(restricted)} inside a trading restriction window (dashed outline)`
          : ''}
        . The coloured edge shows impact: grey low, blue medium, amber high; each event also says it
        in words.
      </p>

      {layout === 'day' ? (
        (byDate.get(anchor) ?? []).length === 0 ? (
          <p className={styles.note}>
            No {heldOnly ? 'events for held instruments' : 'events'} on this day.
          </p>
        ) : (
          <ul className={styles.eventList} aria-label={rangeLabel(anchor, layout)}>
            {(byDate.get(anchor) ?? []).map((event) => item(event, true))}
          </ul>
        )
      ) : (
        <div className={styles.calendar} role="grid" aria-label={rangeLabel(anchor, layout)}>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className={styles.weekday} role="columnheader">
              {label}
            </span>
          ))}
          {days.map((day) => {
            const dayEvents = byDate.get(day.date) ?? [];
            return (
              <div
                key={day.date}
                role="gridcell"
                className={cx(
                  styles.day,
                  day.inRange ? undefined : styles.outside,
                  day.date === today ? styles.today : undefined,
                )}
              >
                <button
                  type="button"
                  className={styles.link}
                  aria-label={`${day.date}${day.date === today ? ' (today)' : ''}, ${String(dayEvents.length)} events. Open day`}
                  onClick={() => {
                    setAnchor(day.date);
                    setLayout('day');
                  }}
                >
                  {Number(day.date.slice(8))}
                </button>
                {dayEvents.length > 0 && (
                  <ul className={styles.eventList}>
                    {dayEvents.map((event) => item(event, layout === 'week'))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {shown.length === 0 && layout !== 'day' && (
        <p className={styles.note}>
          No {heldOnly ? 'events for held instruments' : 'events'} in this {layout}. Move to another{' '}
          {layout} or clear the held-only filter.
        </p>
      )}
    </div>
  );
}
