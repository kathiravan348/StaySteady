// News live feed (UI spec 7.6): stories newest first with sentiment estimates, importance, duplicate
// grouping, holdings emphasis, filters and the price reaction around each story.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import {
  useInstruments,
  useMarkets,
  useNewsItems,
  usePortfolioHoldings,
  useProviderConfigs,
} from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { NewsFeedView } from './sections/NewsFeedView';

// The news provider's seeded freshness expectation, used if provider configuration is unavailable.
const DEFAULT_FRESHNESS_SECONDS = 900;

function NewsFeedBody(): ReactElement {
  const news = useNewsItems();
  const instruments = useInstruments();
  const markets = useMarkets();
  const holdings = usePortfolioHoldings();
  // Optional: without it the feed still works, using the seeded expectation.
  const providers = useProviderConfigs();

  const heldIds = useMemo(
    () => new Set((holdings.data ?? []).map((holding) => String(holding.instrumentId))),
    [holdings.data],
  );

  const failed = [news, instruments, markets].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="News unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void news.refetch();
          void instruments.refetch();
          void markets.refetch();
        }}
      />
    );
  }
  if (news.data === undefined || instruments.data === undefined || markets.data === undefined) {
    return <LoadingState layout="cards" count={5} />;
  }
  if (news.data.length === 0) {
    return (
      <EmptyState
        title="No news yet"
        description="Stories from the configured news providers appear here as they arrive."
      />
    );
  }
  const freshness =
    providers.data?.find((entry) => entry.config.coverage.dataKinds.includes('news'))?.config
      .freshnessSeconds ?? DEFAULT_FRESHNESS_SECONDS;

  return (
    <NewsFeedView
      items={news.data}
      instruments={instruments.data}
      markets={markets.data}
      heldIds={heldIds}
      freshnessSeconds={freshness}
      onRefresh={() => {
        void news.refetch();
      }}
    />
  );
}

export function NewsFeedPage(): ReactElement {
  return (
    <PageShell
      title="News"
      description="Stories newest first. Sentiment is a model estimate and always shows its confidence; stories about your holdings are marked."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'News & events' },
        { label: 'Live feed' },
      ]}
    >
      <NewsFeedBody />
    </PageShell>
  );
}
