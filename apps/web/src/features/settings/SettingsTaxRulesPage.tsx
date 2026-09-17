// Tax rule sets (E-09; requirements 26; decision 45): holding periods, rates, exemptions, cost basis,
// tax year and foreign asset obligations for the country of residence, saved as versions.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useTaxRuleSets } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { SettingsNav } from './sections/SettingsNav';
import { TaxRulesView } from './taxRules/sections/TaxRulesView';

function TaxRulesBody(): ReactElement {
  const rules = useTaxRuleSets();
  if (rules.isError) {
    return (
      <ErrorState
        title="Tax rules unavailable"
        message={rules.error.message}
        onRetry={() => {
          void rules.refetch();
        }}
      />
    );
  }
  if (rules.data === undefined) return <LoadingState layout="detail" count={4} />;
  if (rules.data.length === 0) {
    return (
      <EmptyState
        title="No tax rules configured"
        description="Without a residence rule set, holdings show no tax status and reports estimate no tax."
      />
    );
  }
  return <TaxRulesView entries={rules.data} />;
}

export function SettingsTaxRulesPage(): ReactElement {
  return (
    <PageShell
      title="Tax rules"
      description="How gains are taxed where you live: holding periods, rates and exemptions per asset class, the tax year and foreign asset obligations."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Tax rules' },
      ]}
    >
      <SettingsNav />
      <TaxRulesBody />
    </PageShell>
  );
}
