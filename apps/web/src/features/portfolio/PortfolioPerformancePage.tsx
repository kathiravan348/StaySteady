// Portfolio performance at a glance (nav map 6; open question 9, recommended option): returns for
// standard periods, value since the first purchase, monthly returns and contribution by holding.

import { EmptyState, ErrorState, LoadingState, StaleState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { usePortfolioPerformance } from '../../data/api';
import { useSystemState } from '../../providers/SystemStateProvider';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { PerformanceView } from './performance/sections/PerformanceView';

const DAY_MS = 24 * 60 * 60 * 1000;

function PerformanceBody(): ReactElement {
  const { baseCurrency } = useSystemState();
  const performance = usePortfolioPerformance(baseCurrency);

  if (performance.isError) {
    return (
      <ErrorState
        title="Performance unavailable"
        message={performance.error.message}
        onRetry={() => {
          void performance.refetch();
        }}
      />
    );
  }
  if (performance.data === undefined) return <LoadingState layout="chart" />;
  if (performance.data.series.length < 2 || performance.data.value.amount === '0.00') {
    return (
      <EmptyState
        title="No performance yet"
        description="Returns appear once the portfolio has held something for a while."
      />
    );
  }
  // Valuations use the previous day's close, so anything older means closing prices are missing.
  const lastClose = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
  const daysBehind = Math.round(
    (Date.parse(lastClose) - Date.parse(performance.data.asOf)) / DAY_MS,
  );
  return (
    <>
      {daysBehind > 0 && (
        <StaleState
          isBanner
          ageText={`valued at the ${performance.data.asOf} close, ${daysBehind} ${daysBehind === 1 ? 'day' : 'days'} behind the last close, so recent moves are missing`}
          lastUpdated={performance.data.asOf}
          onRefresh={() => {
            void performance.refetch();
          }}
        />
      )}
      <PerformanceView data={performance.data} />
    </>
  );
}

export function PortfolioPerformancePage(): ReactElement {
  return (
    <PageShell
      title="Performance"
      description="How the portfolio has done: returns for standard periods, monthly returns and what each holding contributed."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Portfolio', to: ROUTES.PORTFOLIO_HOLDINGS },
        { label: 'Performance' },
      ]}
    >
      <PerformanceBody />
    </PageShell>
  );
}
