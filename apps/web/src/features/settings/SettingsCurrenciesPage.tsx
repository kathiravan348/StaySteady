// Currency configuration (UI spec 7.18): base currency selection, exchange rate source and conversion
// cost assumptions, each change saved as a version.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useBaseCurrencyConfig, useCurrencyConfigs, useProviderConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { OperatingCostBudgetSection } from './budget/OperatingCostBudgetSection';
import { CurrenciesView } from './currencies/sections/CurrenciesView';
import { TaxRulesAndInflationSection } from './tax/TaxRulesAndInflationSection';

function CurrenciesBody(): ReactElement {
  const currencies = useCurrencyConfigs();
  const base = useBaseCurrencyConfig();
  // Rate sources are the configured data providers that supply FX rates.
  const providers = useProviderConfigs();

  const failed = [currencies, base, providers].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Currency configuration unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void currencies.refetch();
          void base.refetch();
          void providers.refetch();
        }}
      />
    );
  }
  if (currencies.data === undefined || base.data === undefined || providers.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  if (currencies.data.length === 0) {
    return (
      <EmptyState
        title="No currencies configured"
        description="Supported currencies come with the platform; none were returned."
      />
    );
  }
  return <CurrenciesView entries={currencies.data} base={base.data} providers={providers.data} />;
}

export function SettingsCurrenciesPage(): ReactElement {
  return (
    <PageShell
      title="Currencies & Economic Assumptions"
      description="The currency totals are reported in, exchange rate sources, statutory tax rules, inflation rates, and algorithmic operating budgets."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Currencies' },
      ]}
    >
      <CurrenciesBody />
      <div style={{ marginTop: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}>
        <TaxRulesAndInflationSection />
        <OperatingCostBudgetSection />
      </div>
    </PageShell>
  );
}
