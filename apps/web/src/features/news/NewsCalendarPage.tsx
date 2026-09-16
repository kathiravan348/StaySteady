// Events calendar (UI spec 7.6): month, week and day layouts, events marked by category and impact,
// trading restriction windows marked, and a held-instruments filter.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useCalendarEvents, useInstruments, usePortfolioHoldings } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { CalendarView } from './sections/CalendarView';

function CalendarBody(): ReactElement {
  const events = useCalendarEvents();
  const instruments = useInstruments();
  const holdings = usePortfolioHoldings();

  const heldIds = useMemo(
    () => new Set((holdings.data ?? []).map((holding) => String(holding.instrumentId))),
    [holdings.data],
  );

  const failed = [events, instruments].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Calendar unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void events.refetch();
          void instruments.refetch();
        }}
      />
    );
  }
  if (events.data === undefined || instruments.data === undefined) {
    return <LoadingState layout="cards" count={4} />;
  }
  if (events.data.length === 0) {
    return (
      <EmptyState
        title="No events scheduled"
        description="Earnings, central bank decisions, dividends and market holidays appear here."
      />
    );
  }
  return <CalendarView events={events.data} instruments={instruments.data} heldIds={heldIds} />;
}

export function NewsCalendarPage(): ReactElement {
  return (
    <PageShell
      title="Events calendar"
      description="Earnings, central bank decisions, economic data, dividends and market holidays. Events inside a trading restriction window are marked."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'News & events' },
        { label: 'Calendar' },
      ]}
    >
      <CalendarBody />
    </PageShell>
  );
}
