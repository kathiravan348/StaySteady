// Planning assumptions and operating policy (E-09; requirements 30, 32, 34; UI spec 7.18 and 19.2):
// inflation assumed per country, the running-cost budget, the counterparty threshold and export
// settings, each change saved as a version.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useInflationAssumptions, useInflationHistory, useOperatingPolicy } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { AssumptionsView } from './assumptions/sections/AssumptionsView';
import { SettingsNav } from './sections/SettingsNav';

function AssumptionsBody(): ReactElement {
  const inflation = useInflationAssumptions();
  const policy = useOperatingPolicy();
  const history = useInflationHistory();

  const failed = [inflation, policy, history].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Assumptions unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void inflation.refetch();
          void policy.refetch();
          void history.refetch();
        }}
      />
    );
  }
  if (inflation.data === undefined || policy.data === undefined || history.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  const entry = policy.data[0];
  if (entry === undefined || inflation.data.length === 0) {
    return (
      <EmptyState
        title="No assumptions configured"
        description="The operating policy and inflation assumptions come with the platform; none were returned."
      />
    );
  }
  return <AssumptionsView inflation={inflation.data} policy={entry} history={history.data} />;
}

export function SettingsAssumptionsPage(): ReactElement {
  return (
    <PageShell
      title="Assumptions & budget"
      description="Inflation assumed per country, the monthly running-cost budget, when one counterparty holds too much, and what is exported."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Assumptions & budget' },
      ]}
    >
      <SettingsNav />
      <AssumptionsBody />
    </PageShell>
  );
}
