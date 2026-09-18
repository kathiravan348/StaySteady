// News and events tab (UI spec 20.1; requirements 38): what is scheduled ahead, the news that
// reaches this instrument directly or through its group and industry, its filings and its
// corporate actions. One request feeds the tab, so it loads, fails and goes stale as one.

import { ErrorState, LoadingState, StaleState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useInstrumentFeed } from '../../../../data/api';
import { formatDateTime, formatRelativeTime } from '../../../../shared/format';
import { toIsoUtcTimestamp } from '../../../../shared/types/dateTime';
import styles from '../CompanyResearch.module.scss';
import { FeedNewsList } from './FeedNewsList';
import { ActionsCard, FilingsCard } from './FeedRecords';
import { FeedSchedule } from './FeedSchedule';

interface NewsEventsTabProps {
  readonly instrumentId: string;
  readonly symbol: string;
}

export function NewsEventsTab({ instrumentId, symbol }: NewsEventsTabProps): ReactElement {
  const feed = useInstrumentFeed(instrumentId);

  if (feed.data === undefined) {
    return feed.isError ? (
      <ErrorState
        title="News and events unavailable"
        message={feed.error.message}
        onRetry={() => {
          void feed.refetch();
        }}
      />
    ) : (
      <LoadingState layout="cards" count={4} />
    );
  }

  const updated = toIsoUtcTimestamp(new Date(feed.dataUpdatedAt));
  return (
    <div className={styles.stack}>
      {feed.isRefetchError && (
        <StaleState
          isBanner
          ageText={formatRelativeTime(updated)}
          lastUpdated={formatDateTime(updated)}
          onRefresh={() => {
            void feed.refetch();
          }}
        />
      )}
      <FeedSchedule feed={feed.data} />
      <FeedNewsList news={feed.data.news} instrumentId={instrumentId} symbol={symbol} />
      <FilingsCard feed={feed.data} instrumentId={instrumentId} symbol={symbol} />
      <ActionsCard feed={feed.data} instrumentId={instrumentId} symbol={symbol} />
      <span className={styles.meta}>
        {feed.data.source}, as of {feed.data.asOf}. Nothing here is advice; sentiment is a model
        estimate.
      </span>
    </div>
  );
}
