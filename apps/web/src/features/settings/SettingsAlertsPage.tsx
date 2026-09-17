// Alert rule configuration (UI spec 7.18): per category and severity, channel selection, escalation,
// and quiet hours with a critical override, each change saved as a version, with a test alert.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useAlertChannels, useAlertRuleConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { AlertRulesView } from './alerts/sections/AlertRulesView';
import { SettingsNav } from './sections/SettingsNav';

function AlertRulesBody(): ReactElement {
  const rules = useAlertRuleConfigs();
  // Channels are the ones System Health tests, with their last result.
  const channels = useAlertChannels();

  const failed = rules.isError ? rules : channels.isError ? channels : null;
  if (failed !== null) {
    return (
      <ErrorState
        title="Alert rules unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void rules.refetch();
          void channels.refetch();
        }}
      />
    );
  }
  if (rules.data === undefined || channels.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  if (rules.data.length === 0) {
    return (
      <EmptyState
        title="No alert rules"
        description="Without a rule, alerts appear only in the alerts centre. Add one to be told."
      />
    );
  }
  return <AlertRulesView entries={rules.data} channels={channels.data} />;
}

export function SettingsAlertsPage(): ReactElement {
  return (
    <PageShell
      title="Alert rules"
      description="Which alerts reach you, on which channels, when they escalate, and when they wait for morning. Every change is kept as a version."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Alert rules' },
      ]}
    >
      <SettingsNav />
      <AlertRulesBody />
    </PageShell>
  );
}
