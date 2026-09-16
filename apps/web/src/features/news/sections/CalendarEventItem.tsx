import { cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { CalendarEventDto, InstrumentDto } from '../../../data/schemas';
import { humanizeToken } from '../../../shared/format';
import { EVENT_TYPE_LABELS } from '../model/calendarModel';
import styles from '../News.module.scss';

const IMPACT_CLASS: Readonly<Record<CalendarEventDto['impact'], string | undefined>> = {
  low: undefined,
  medium: styles.impactMedium,
  high: styles.impactHigh,
};

// One event. Category and importance are in words as well as the coloured edge, and a restriction
// window has its own dashed outline and label, so no meaning rests on colour alone.
export function CalendarEventItem({
  event,
  instrument,
  isHeld,
  isDetailed,
}: {
  readonly event: CalendarEventDto;
  readonly instrument: InstrumentDto | undefined;
  readonly isHeld: boolean;
  readonly isDetailed: boolean;
}): ReactElement {
  return (
    <li
      className={cx(
        styles.event,
        IMPACT_CLASS[event.impact],
        event.inTradingRestrictionWindow ? styles.restricted : undefined,
      )}
    >
      <strong>{event.title}</strong>
      <span>
        {EVENT_TYPE_LABELS[event.eventType]} · {humanizeToken(event.impact)} impact
        {isDetailed ? ` · ${String(event.marketId)}` : ''}
        {instrument !== undefined ? ` · ${instrument.symbol}${isHeld ? ' (held)' : ''}` : ''}
      </span>
      {event.inTradingRestrictionWindow && <span>Inside a trading restriction window</span>}
      {isDetailed && event.description !== undefined && <span>{event.description}</span>}
    </li>
  );
}
