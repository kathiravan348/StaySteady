// Alerts Centre (UI spec 7.19): every alert with severity, category, source and state; filters;
// repeats grouped; acknowledge and resolve with notes; escalation for unacknowledged critical alerts.

import { EmptyState, ErrorState, LoadingState, StaleState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useAlertCentre, useMarkets } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { AlertCentreView } from './sections/AlertCentreView';

// The list refreshes every minute; older than this it is marked stale.
const STALE_AFTER_MS = 3 * 60_000;

function AlertsBody(): ReactElement {
  const alerts = useAlertCentre();
  const markets = useMarkets();

  if (alerts.isError && alerts.data === undefined) {
    return (
      <ErrorState
        title="Alerts unavailable"
        message={alerts.error.message}
        onRetry={() => {
          void alerts.refetch();
        }}
      />
    );
  }
  if (alerts.data === undefined) return <LoadingState layout="cards" count={4} />;
  if (alerts.data.length === 0) {
    return (
      <EmptyState
        title="No alerts"
        description="Nothing has needed your attention. Alerts appear here as they are raised."
      />
    );
  }
  // A failed refresh keeps the last list on screen, marked as out of date.
  const isStale = alerts.isError || Date.now() - alerts.dataUpdatedAt > STALE_AFTER_MS;
  return (
    <>
      {isStale && (
        <StaleState
          isBanner
          ageText="the alert list could not be refreshed"
          lastUpdated={new Date(alerts.dataUpdatedAt).toLocaleTimeString('en-GB')}
          onRefresh={() => {
            void alerts.refetch();
          }}
        />
      )}
      <AlertCentreView alerts={alerts.data} markets={markets.data ?? []} />
    </>
  );
}

export function AlertsPage(): ReactElement {
  return (
    <PageShell
      title="Alerts"
      description="Everything that needed attention, newest first. Acknowledge to stop an escalation; resolve when it is dealt with."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Alerts' }]}
    >
      <AlertsBody />
    </PageShell>
  );
}
