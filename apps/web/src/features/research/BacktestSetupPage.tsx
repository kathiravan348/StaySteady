// Backtest Setup screen (UI spec 7.9): configure a run, see what could make it misleading, start it.

import { ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { BacktestSetupView } from './backtestSetup/sections/BacktestSetupView';
import { useBacktestSetup } from './backtestSetup/useBacktestSetup';

export function BacktestSetupPage(): ReactElement {
  const [params] = useSearchParams();
  const setup = useBacktestSetup(params.get('strategy'));

  let body: ReactElement;
  switch (setup.status) {
    case 'loading':
      body = <LoadingState layout="table" count={6} />;
      break;
    case 'error':
      body = (
        <ErrorState
          title="Backtest setup unavailable"
          message={setup.message}
          onRetry={setup.retry}
        />
      );
      break;
    case 'ready':
      body = <BacktestSetupView setup={setup} />;
      break;
  }

  return (
    <PageShell
      title="New backtest"
      description="Choose the strategy, period, universe and cost assumptions, then run it."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Strategies', to: ROUTES.RESEARCH_STRATEGIES },
        { label: 'New backtest' },
      ]}
    >
      {body}
    </PageShell>
  );
}
