// Backtest Comparison screen (UI spec 7.11): two to four saved runs overlaid, metric by metric,
// with the configuration differences that could explain them.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './backtestCompare/BacktestCompare.module.scss';
import { CompareView } from './backtestCompare/sections/CompareView';
import { useCompareRuns } from './backtestCompare/useCompareRuns';
import { BacktestNav } from './backtestResults/sections/BacktestNav';

function CompareBody(): ReactElement {
  const compare = useCompareRuns();

  if (compare.error !== null) {
    return (
      <ErrorState title="Comparison unavailable" message={compare.error} onRetry={compare.retry} />
    );
  }
  if (compare.isLoading) {
    return <LoadingState layout="table" count={6} />;
  }
  if (compare.available.length === 0) {
    return (
      <EmptyState
        title="No saved backtests"
        description="Run at least two backtests to compare them."
        action={
          <Link to={ROUTES.RESEARCH_BACKTEST_NEW} className={styles.link}>
            Set up a backtest
          </Link>
        }
      />
    );
  }
  return (
    <CompareView
      available={compare.available}
      selectedIds={compare.selectedIds}
      runs={compare.runs}
      onToggle={compare.toggle}
      onClear={compare.clear}
    />
  );
}

export function BacktestComparePage(): ReactElement {
  return (
    <PageShell
      title="Compare backtests"
      description="Two to four saved runs overlaid from a common start, with the metric gaps and the settings behind them."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Strategies', to: ROUTES.RESEARCH_STRATEGIES },
        { label: 'Backtest results', to: ROUTES.RESEARCH_BACKTEST_RESULTS },
        { label: 'Compare' },
      ]}
    >
      <BacktestNav />
      <CompareBody />
    </PageShell>
  );
}
