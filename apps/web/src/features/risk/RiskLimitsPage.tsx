// Risk & Safety panel (UI spec 7.14): every limit in one place, with emergency controls and the
// record of every change. Breach history is on its own route.

import { ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useRiskPanel } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { RiskPanelView } from './sections/RiskPanelView';

function PanelBody(): ReactElement {
  const panel = useRiskPanel();

  if (panel.isError) {
    return (
      <ErrorState
        title="Risk panel unavailable"
        message={panel.error.message}
        onRetry={() => {
          void panel.refetch();
        }}
      />
    );
  }
  if (panel.data === undefined) {
    return <LoadingState layout="cards" count={6} />;
  }
  return <RiskPanelView panel={panel.data} />;
}

export function RiskLimitsPage(): ReactElement {
  return (
    <PageShell
      title="Risk & safety"
      description="Every limit with its usage and headroom, the emergency controls, and every recorded change."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Risk & safety' }]}
    >
      <PanelBody />
    </PageShell>
  );
}
