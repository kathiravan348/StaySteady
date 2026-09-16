// Strategy Library screen (UI spec 7.7): every strategy, what it is allowed to do, what it holds,
// how it was proven and how it is actually behaving.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useStrategyLibrary } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { LibraryView } from './strategyLibrary/sections/LibraryView';
import styles from './strategyLibrary/StrategyLibrary.module.scss';

function LibraryBody(): ReactElement {
  const library = useStrategyLibrary();

  if (library.isError) {
    return (
      <ErrorState
        title="Strategy library unavailable"
        message={library.error.message}
        onRetry={() => {
          void library.refetch();
        }}
      />
    );
  }
  if (library.data === undefined) {
    return <LoadingState layout="table" count={5} />;
  }
  if (library.data.length === 0) {
    return (
      <EmptyState
        title="No strategies yet"
        description="A strategy defines what to buy and sell, and when. Create one to start."
        action={
          <Link to={ROUTES.RESEARCH_EDITOR} className={styles.link}>
            Open the strategy editor
          </Link>
        }
      />
    );
  }
  return <LibraryView entries={library.data} />;
}

export function ResearchStrategiesPage(): ReactElement {
  return (
    <PageShell
      title="Strategy Library"
      description="Every strategy with its lifecycle stage, capital, backtest, live result and last run."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Strategies' }]}
    >
      <LibraryBody />
    </PageShell>
  );
}
