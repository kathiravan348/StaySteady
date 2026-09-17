// Backtest Results screen (UI spec 7.10): the heaviest metric and chart screen.
// Without an id in the route it lists the saved runs to open.

import { Badge, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useBacktest, useBacktestDetail, useBacktests } from '../../data/api';
import { backtestResultsPath, ROUTES } from '../../routes/routes';
import { formatSignedPercent, pluralize } from '../../shared/format';
import { PageShell } from '../../shell/PageShell';
import styles from './backtestResults/BacktestResults.module.scss';
import { BacktestNav } from './backtestResults/sections/BacktestNav';
import { ResultsView } from './backtestResults/sections/ResultsView';

function SavedRuns(): ReactElement {
  const backtests = useBacktests();
  if (backtests.data === undefined) {
    return backtests.isError ? (
      <ErrorState
        title="Backtests unavailable"
        message={backtests.error.message}
        onRetry={() => {
          void backtests.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={4} />
    );
  }
  if (backtests.data.length === 0) {
    return (
      <EmptyState
        title="No saved backtests"
        description="Run a backtest to see its results here."
        action={
          <Link to={ROUTES.RESEARCH_BACKTEST_NEW} className={styles.link}>
            Set up a backtest
          </Link>
        }
      />
    );
  }
  return (
    <ul className={styles.resultList}>
      {backtests.data.map((result) => (
        <li key={result.id} className={styles.resultRow}>
          <span className={styles.stack}>
            <Link to={backtestResultsPath(result.id)} className={styles.link}>
              {result.strategyId}
            </Link>
            <span className={styles.meta}>
              {result.startDate} to {result.endDate} ·{' '}
              {pluralize(result.metrics.totalTrades, 'trade')}
            </span>
          </span>
          <span className={styles.inline}>
            <span className={result.totalReturnPercent >= 0 ? styles.positive : styles.negative}>
              {formatSignedPercent(result.totalReturnPercent)}
            </span>
            {result.hasOutlierDependency && <Badge variant="warning">Outlier dependent</Badge>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ResultDetail({ backtestId }: { readonly backtestId: string }): ReactElement {
  const result = useBacktest(backtestId);
  const detail = useBacktestDetail(backtestId);

  const failed = [result, detail].find((query) => query.isError);
  if (failed !== undefined) {
    const isMissing = failed.error?.message.includes('404') === true;
    return isMissing ? (
      <EmptyState
        title="Backtest not found"
        description={`No saved backtest has the id "${backtestId}".`}
        action={
          <Link to={ROUTES.RESEARCH_BACKTEST_RESULTS} className={styles.link}>
            See saved runs
          </Link>
        }
      />
    ) : (
      <ErrorState
        title="Backtest result unavailable"
        message={failed.error?.message ?? 'Unknown error'}
        onRetry={() => {
          void result.refetch();
          void detail.refetch();
        }}
      />
    );
  }
  if (result.data === undefined || detail.data === undefined) {
    return <LoadingState layout="table" count={8} />;
  }
  return <ResultsView result={result.data} detail={detail.data} />;
}

export function BacktestResultsPage(): ReactElement {
  const { id } = useParams<{ id?: string }>();

  return (
    <PageShell
      title={id === undefined ? 'Backtest results' : 'Backtest result'}
      description={
        id === undefined
          ? 'Saved runs, newest configuration first.'
          : 'Headline metrics, equity and drawdown, trades, costs and what could make this misleading.'
      }
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Strategies', to: ROUTES.RESEARCH_STRATEGIES },
        ...(id === undefined
          ? [{ label: 'Backtest results' }]
          : [{ label: 'Backtest results', to: ROUTES.RESEARCH_BACKTEST_RESULTS }, { label: id }]),
      ]}
    >
      <BacktestNav />
      {id === undefined ? <SavedRuns /> : <ResultDetail backtestId={id} />}
    </PageShell>
  );
}
