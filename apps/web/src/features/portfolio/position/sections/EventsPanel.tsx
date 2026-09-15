import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import { useCalendarEvents, useCorporateActions } from '../../../../data/api';
import { formatIsoDate, formatMoney, humanizeToken } from '../../../../shared/format';
import { selectUpcomingMarketEvents, sortCorporateActions } from '../model/positionLists';
import styles from '../PositionPage.module.scss';

export interface EventsPanelProps {
  readonly instrumentId: string;
  readonly marketId: string;
  readonly marketName: string;
}

// UI spec 7.3 — upcoming events for this instrument: its corporate actions and market calendar.
export function EventsPanel({
  instrumentId,
  marketId,
  marketName,
}: EventsPanelProps): ReactElement {
  const actions = useCorporateActions(instrumentId);
  const calendar = useCalendarEvents();
  const today = new Date().toISOString().slice(0, 10);
  const sortedActions = useMemo(() => sortCorporateActions(actions.data ?? []), [actions.data]);
  const events = useMemo(
    () => selectUpcomingMarketEvents(calendar.data ?? [], marketId, today),
    [calendar.data, marketId, today],
  );

  const actionsBody = actions.isError ? (
    <ErrorState
      title="Corporate actions unavailable"
      message={actions.error.message}
      onRetry={() => {
        void actions.refetch();
      }}
    />
  ) : actions.isPending ? (
    <LoadingState layout="table" count={3} />
  ) : sortedActions.length === 0 ? (
    <p className={styles.note}>No dividends, splits or bonus issues recorded.</p>
  ) : (
    <ul className={styles.list}>
      {sortedActions.map((action) => (
        <li key={action.id} className={styles.stackedRow}>
          <span className={styles.wrapText}>{action.description}</span>
          <span className={styles.meta}>
            {formatIsoDate(action.effectiveDate)} · {humanizeToken(action.type)}
            {action.ratio === undefined ? '' : ` · ratio ${action.ratio}`}
            {action.cashAmount === undefined
              ? ''
              : ` · ${formatMoney(moneyFromDto(action.cashAmount), { showCurrency: 'code' })} per share`}
          </span>
          <span className={styles.badges}>
            <Badge variant={action.effectiveDate >= today ? 'warning' : 'neutral'}>
              {action.effectiveDate >= today ? 'Upcoming' : 'Past'}
            </Badge>
          </span>
        </li>
      ))}
    </ul>
  );

  const calendarBody = calendar.isError ? (
    <ErrorState
      title="Calendar unavailable"
      message={calendar.error.message}
      onRetry={() => {
        void calendar.refetch();
      }}
    />
  ) : calendar.isPending ? (
    <LoadingState layout="table" count={3} />
  ) : events.length === 0 ? (
    <p className={styles.note}>No upcoming events for {marketName}.</p>
  ) : (
    <ul className={styles.list}>
      {events.map((event) => (
        <li key={event.id} className={styles.stackedRow}>
          <span className={styles.wrapText}>{event.title}</span>
          <span className={styles.meta}>{formatIsoDate(event.date)}</span>
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
    <div className={styles.panelGrid}>
      <Card title="Corporate actions">{actionsBody}</Card>
      <Card title={`Upcoming ${marketName} events`}>{calendarBody}</Card>
    </div>
  );
}
