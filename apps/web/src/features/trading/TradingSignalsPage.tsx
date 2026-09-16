// Signals feed (UI spec 7.12): every signal generated, what became of it, and which limit stopped
// the ones that went nowhere.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSignalFeed } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { FeedView } from './signalsFeed/sections/FeedView';

function FeedBody(): ReactElement {
  const feed = useSignalFeed();

  if (feed.isError) {
    return (
      <ErrorState
        title="Signals feed unavailable"
        message={feed.error.message}
        onRetry={() => {
          void feed.refetch();
        }}
      />
    );
  }
  if (feed.data === undefined) {
    return <LoadingState layout="table" count={6} />;
  }
  if (feed.data.length === 0) {
    return (
      <EmptyState
        title="No signals yet"
        description="Strategies at observation stage and above record every signal they raise here."
      />
    );
  }
  return <FeedView entries={feed.data} />;
}

export function TradingSignalsPage(): ReactElement {
  return (
    <PageShell
      title="Signals"
      description="Every signal raised, what happened to it, and the limit that stopped the ones that were blocked."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Signals' }]}
    >
      <FeedBody />
    </PageShell>
  );
}
