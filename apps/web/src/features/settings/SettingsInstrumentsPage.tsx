// Instrument type configuration (UI spec 7.18): enabled, automation permitted, applicable markets,
// granularity, minimum sizes, settlement, tax thresholds and the manual-only flag, each change saved as
// a version.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useInstrumentTypeConfigs, useMarketConfigs } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { InstrumentTypesView } from './instruments/sections/InstrumentTypesView';

function InstrumentsBody(): ReactElement {
  const types = useInstrumentTypeConfigs();
  const markets = useMarketConfigs();

  const failed = types.isError ? types : markets.isError ? markets : null;
  if (failed !== null) {
    return (
      <ErrorState
        title="Instrument type configuration unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void types.refetch();
          void markets.refetch();
        }}
      />
    );
  }
  if (types.data === undefined || markets.data === undefined) {
    return <LoadingState layout="detail" count={4} />;
  }
  if (types.data.length === 0) {
    return (
      <EmptyState
        title="No instrument types configured"
        description="Instrument types come with the platform; none were returned."
      />
    );
  }
  return <InstrumentTypesView entries={types.data} markets={markets.data} />;
}

export function SettingsInstrumentsPage(): ReactElement {
  return (
    <PageShell
      title="Instrument types"
      description="What kinds of instrument can be traded, where, in what sizes, whether automation may trade them, and how they settle and are taxed. Every change is kept as a version."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Instrument types' },
      ]}
    >
      <InstrumentsBody />
    </PageShell>
  );
}
