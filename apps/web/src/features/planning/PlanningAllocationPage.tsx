// Allocation targets (UI spec 7.17): targets by instrument type, country, currency and sector against
// actual, drift beyond tolerance highlighted, and suggested corrective trades with estimated costs.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useAllocationPlan } from '../../data/api';
import type { ReportCurrencyDto } from '../../data/schemas';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { AllocationView } from './sections/AllocationView';

function AllocationBody(): ReactElement {
  // Null follows the configured base currency until another is picked.
  const [currency, setCurrency] = useState<ReportCurrencyDto | null>(null);
  const allocation = useAllocationPlan(currency);

  if (allocation.isError) {
    return (
      <ErrorState
        title="Allocation unavailable"
        message={allocation.error.message}
        onRetry={() => {
          void allocation.refetch();
        }}
      />
    );
  }
  if (allocation.data === undefined) return <LoadingState layout="detail" count={3} />;
  if (allocation.data.total.amount === '0.00') {
    return (
      <EmptyState
        title="Nothing to allocate yet"
        description="Targets are compared with holdings once the portfolio holds something."
      />
    );
  }
  return (
    <AllocationView view={allocation.data} currency={currency} onCurrencyChange={setCurrency} />
  );
}

export function PlanningAllocationPage(): ReactElement {
  return (
    <PageShell
      title="Allocation targets"
      description="Where the money should sit against where it does, and the trades that would close the gap. Nothing is ordered from here."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Planning' },
        { label: 'Allocation' },
      ]}
    >
      <AllocationBody />
    </PageShell>
  );
}
