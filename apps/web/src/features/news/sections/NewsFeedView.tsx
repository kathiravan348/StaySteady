import { Button, NoResultsState, StaleState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import type {
  ClassificationIndexDto,
  ClassificationTaxonomyDto,
  InstrumentDto,
  MarketDto,
  NewsItemDto,
} from '../../../data/schemas';
import type { NewsFilters } from '../model/newsFeed';
import { placeStories } from '../model/newsPlacement';
import {
  DEFAULT_NEWS_FILTERS,
  applyNewsFilters,
  describeAge,
  feedAge,
  groupStories,
  isNewsFiltered,
} from '../model/newsFeed';
import { formatDateTime } from '../../../shared/format';
import styles from '../News.module.scss';
import { NewsFilterBar } from './NewsFilterBar';
import { NewsStoryCard } from './NewsStoryCard';

export interface NewsFeedViewProps {
  readonly items: readonly NewsItemDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly heldIds: ReadonlySet<string>;
  // Optional: without the shared classification the sector, industry and group filters are hidden.
  readonly classification: {
    readonly index: ClassificationIndexDto;
    readonly taxonomy: ClassificationTaxonomyDto;
  } | null;
  // How old the newest story may be before the feed counts as behind (the news provider's setting).
  readonly freshnessSeconds: number;
  readonly onRefresh: () => void;
}

// UI spec 7.6 — the live feed, newest first, with duplicate stories grouped.
export function NewsFeedView({
  items,
  instruments,
  markets,
  heldIds,
  classification,
  freshnessSeconds,
  onRefresh,
}: NewsFeedViewProps): ReactElement {
  const [filters, setFilters] = useState<NewsFilters>(DEFAULT_NEWS_FILTERS);
  const stories = useMemo(() => groupStories(items, heldIds), [items, heldIds]);
  const placements = useMemo(
    () =>
      classification === null
        ? null
        : placeStories(stories, classification.index, classification.taxonomy, heldIds),
    [stories, classification, heldIds],
  );
  const visible = applyNewsFilters(stories, filters, markets, placements?.byStory);
  const byId = useMemo(
    () => new Map(instruments.map((instrument) => [String(instrument.id), instrument])),
    [instruments],
  );
  const age = feedAge(stories, Date.now());
  const isStale = age !== null && age.minutes * 60 > freshnessSeconds;
  const newest = stories[0];

  const mentioned = new Set(stories.flatMap((story) => story.instrumentIds));
  const storyMarkets = new Set(stories.flatMap((story) => story.marketIds));
  const options = {
    markets: markets
      .filter((market) => storyMarkets.has(String(market.marketId)))
      .map((market) => ({ value: String(market.marketId), label: market.name })),
    countries: [
      ...new Set(
        markets
          .filter((market) => storyMarkets.has(String(market.marketId)))
          .map((market) => market.country),
      ),
    ],
    instruments: instruments
      .filter((instrument) => mentioned.has(String(instrument.id)))
      .map((instrument) => ({
        value: String(instrument.id),
        label: `${instrument.symbol}${heldIds.has(String(instrument.id)) ? ' (held)' : ''}`,
      })),
    sectors: placements?.sectors ?? [],
    industries: placements?.industries ?? [],
    groups: placements?.groups ?? [],
  };
  const heldCount = stories.filter((story) => story.isHeld).length;

  return (
    <div className={styles.page}>
      {isStale && newest !== undefined && (
        <StaleState
          isBanner
          ageText={`newest story is ${describeAge(age.minutes)} old; news is expected within ${describeAge(Math.round(freshnessSeconds / 60))}, so stories may be missing`}
          lastUpdated={formatDateTime(newest.lead.publishedAt)}
          onRefresh={onRefresh}
        />
      )}

      <div className={styles.toolbar}>
        <span className={styles.meta}>
          {items.length} reports in {stories.length} stories · {heldCount} about holdings · newest
          first
        </span>
        {isNewsFiltered(filters) && (
          <Button
            variant="secondary"
            onPress={() => {
              setFilters(DEFAULT_NEWS_FILTERS);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <NewsFilterBar filters={filters} options={options} onChange={setFilters} />

      {visible.length === 0 ? (
        <NoResultsState
          title="No stories match these filters"
          description="Widen the filters or clear them to see the whole feed."
          onClearFilters={() => {
            setFilters(DEFAULT_NEWS_FILTERS);
          }}
        />
      ) : (
        <ul className={styles.feed} aria-label="News stories">
          {visible.map((story) => (
            <NewsStoryCard
              key={story.key}
              story={story}
              instruments={byId}
              heldIds={heldIds}
              heldThroughGroup={placements?.byStory.get(story.key)?.heldThroughGroup ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
