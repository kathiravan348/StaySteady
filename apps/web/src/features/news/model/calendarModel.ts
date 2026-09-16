// The events calendar (UI spec 7.6): month, week and day ranges on UTC calendar dates, event labels,
// and the held-only filter.

import type { CalendarEventDto, CalendarEventTypeDto } from '../../../data/schemas';

export type CalendarLayout = 'month' | 'week' | 'day';
export const CALENDAR_LAYOUTS: readonly CalendarLayout[] = ['month', 'week', 'day'];

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const DAY_MS = 86_400_000;

const toDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
export const addDays = (iso: string, days: number): string =>
  isoDate(new Date(toDate(iso).getTime() + days * DAY_MS));

// Monday of the week containing the date.
function weekStart(iso: string): string {
  const weekday = (toDate(iso).getUTCDay() + 6) % 7;
  return addDays(iso, -weekday);
}

export interface CalendarDay {
  readonly date: string;
  readonly inRange: boolean;
}

export function visibleDays(anchor: string, layout: CalendarLayout): readonly CalendarDay[] {
  if (layout === 'day') return [{ date: anchor, inRange: true }];
  if (layout === 'week') {
    const start = weekStart(anchor);
    return Array.from({ length: 7 }, (_, index) => ({
      date: addDays(start, index),
      inRange: true,
    }));
  }
  // Whole weeks from the one holding the 1st to the one holding the last day of the month.
  const month = anchor.slice(0, 7);
  const first = `${month}-01`;
  const next = toDate(first);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = addDays(isoDate(next), -1);
  const start = weekStart(first);
  const end = addDays(weekStart(lastDay), 6);
  const count = Math.round((toDate(end).getTime() - toDate(start).getTime()) / DAY_MS) + 1;
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index);
    return { date, inRange: date.slice(0, 7) === month };
  });
}

export function shiftAnchor(anchor: string, layout: CalendarLayout, direction: 1 | -1): string {
  if (layout === 'day') return addDays(anchor, direction);
  if (layout === 'week') return addDays(anchor, 7 * direction);
  const date = toDate(`${anchor.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + direction);
  return isoDate(date);
}

export function rangeLabel(anchor: string, layout: CalendarLayout): string {
  const format = (iso: string, options: Intl.DateTimeFormatOptions): string =>
    toDate(iso).toLocaleDateString('en-GB', { timeZone: 'UTC', ...options });
  if (layout === 'month') return format(anchor, { month: 'long', year: 'numeric' });
  if (layout === 'day')
    return format(anchor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const start = weekStart(anchor);
  return `Week of ${format(start, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export const EVENT_TYPE_LABELS: Readonly<Record<CalendarEventTypeDto, string>> = {
  earnings: 'Earnings',
  central_bank: 'Central bank',
  macro_economic: 'Economic data',
  split: 'Split',
  dividend: 'Dividend',
  holiday: 'Market holiday',
};

export function eventsByDate(
  events: readonly CalendarEventDto[],
  heldIds: ReadonlySet<string>,
  heldOnly: boolean,
): ReadonlyMap<string, readonly CalendarEventDto[]> {
  const map = new Map<string, CalendarEventDto[]>();
  events
    .filter(
      (event) =>
        !heldOnly || (event.instrumentId !== undefined && heldIds.has(String(event.instrumentId))),
    )
    .forEach((event) => {
      map.set(event.date, [...(map.get(event.date) ?? []), event]);
    });
  return map;
}
