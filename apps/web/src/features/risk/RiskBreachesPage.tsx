// Breach history (UI spec 7.14): cause, time, what was halted and how each breach resolved.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useRiskBreaches } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { BreachHistoryView } from './sections/BreachHistoryView';
import { RiskNav } from './sections/RiskNav';

function BreachesBody(): ReactElement {
  const breaches = useRiskBreaches();

  if (breaches.isError) {
    return (
      <ErrorState
        title="Breach history unavailable"
        message={breaches.error.message}
        onRetry={() => {
          void breaches.refetch();
        }}
      />
    );
  }
  if (breaches.data === undefined) {
    return <LoadingState layout="table" count={5} />;
  }
  if (breaches.data.length === 0) {
    return (
      <EmptyState
        title="No breaches recorded"
        description="Every time a limit is exceeded it is recorded here, with what it halted."
      />
    );
  }
  return <BreachHistoryView breaches={breaches.data} />;
}

export function RiskBreachesPage(): ReactElement {
  return (
    <PageShell
      title="Breach history"
      description="Every limit breach and safety stop: what caused it, what it halted, and how it ended."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Risk & safety', to: ROUTES.RISK_LIMITS },
        { label: 'Breach history' },
      ]}
    >
      <RiskNav />
      <BreachesBody />
    </PageShell>
  );
}
