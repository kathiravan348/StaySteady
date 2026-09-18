// Strategy Library screen (UI spec 7.7): every strategy, what it is allowed to do, what it holds,
// how it was proven and how it is actually behaving.

import { Button, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useStrategyLibrary } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { CreateStrategyDialog } from './strategyCreate/CreateStrategyDialog';
import { LibraryView } from './strategyLibrary/sections/LibraryView';

function LibraryBody({ onCreate }: { readonly onCreate: () => void }): ReactElement {
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
        action={<Button onPress={onCreate}>New strategy</Button>}
      />
    );
  }
  return <LibraryView entries={library.data} />;
}

export function ResearchStrategiesPage(): ReactElement {
  const [isCreating, setIsCreating] = useState(false);
  const openCreate = (): void => {
    setIsCreating(true);
  };

  return (
    <PageShell
      title="Strategy Library"
      description="Every strategy with its lifecycle stage, capital, backtest, live result and last run."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Strategies' }]}
      actions={<Button onPress={openCreate}>New strategy</Button>}
    >
      <LibraryBody onCreate={openCreate} />
      {isCreating && (
        <CreateStrategyDialog
          onClose={() => {
            setIsCreating(false);
          }}
        />
      )}
    </PageShell>
  );
}
