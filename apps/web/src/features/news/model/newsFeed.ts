// The live news feed (UI spec 7.6): stories grouped by duplicate group, newest first, filtered, with
// labels that keep model estimates (sentiment) apart from facts (source, category, time).

import type {
  MarketDto,
  NewsCategoryDto,
  NewsImportanceDto,
  NewsItemDto,
  NewsSentimentDto,
} from '../../../data/schemas';

// Shared with the company research feed (decision 25); re-exported so this feature reads as before.
export {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  sentimentLabel,
  sentimentReading,
} from '../../../shared/format/newsLabels';

import type { StoryPlacement } from './newsPlacement';

type PlacementSets = Pick<StoryPlacement, 'sectorIds' | 'industryIds' | 'groupIds'>;

export const ALL = 'all';

// One story as reported by one or more outlets. The lead is the most recent report.
export interface NewsStory {
  readonly key: string;
  readonly lead: NewsItemDto;
  // Newest first, lead included.
  readonly reports: readonly NewsItemDto[];
  readonly instrumentIds: readonly string[];
  readonly marketIds: readonly string[];
  readonly isHeld: boolean;
}

const time = (item: NewsItemDto): number => new Date(item.publishedAt).getTime();

export function groupStories(
  items: readonly NewsItemDto[],
  heldIds: ReadonlySet<string>,
): readonly NewsStory[] {
  const groups = new Map<string, NewsItemDto[]>();
  items.forEach((item) => {
    const key = item.duplicateGroupId ?? item.id;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return [...groups.entries()]
    .flatMap(([key, group]) => {
      const reports = [...group].sort((a, b) => time(b) - time(a));
      const lead = reports[0];
      if (lead === undefined) return [];
      const instrumentIds = [
        ...new Set(group.flatMap((item) => item.relatedInstruments.map(String))),
      ];
      return [
        {
          key,
          lead,
          reports,
          instrumentIds,
          marketIds: [...new Set(group.flatMap((item) => item.relatedMarkets.map(String)))],
          isHeld: instrumentIds.some((id) => heldIds.has(id)),
        },
      ];
    })
    .sort((a, b) => time(b.lead) - time(a.lead));
}

export type ImportanceFilter = typeof ALL | 'medium' | 'high';

export interface NewsFilters {
  readonly market: string;
  readonly country: string;
  readonly instrument: string;
  readonly category: NewsCategoryDto | typeof ALL;
  readonly sentiment: NewsSentimentDto | typeof ALL;
  readonly importance: ImportanceFilter;
  readonly heldOnly: boolean;
  // Shared classification (UI spec 20.2): a story matches through what it names or is tagged with.
  readonly sector: string;
  readonly industry: string;
  readonly group: string;
}

export const DEFAULT_NEWS_FILTERS: NewsFilters = {
  market: ALL,
  country: ALL,
  instrument: ALL,
  category: ALL,
  sentiment: ALL,
  importance: ALL,
  heldOnly: false,
  sector: ALL,
  industry: ALL,
  group: ALL,
};

const IMPORTANCE_RANK: Readonly<Record<NewsImportanceDto, number>> = { low: 0, medium: 1, high: 2 };

export function applyNewsFilters(
  stories: readonly NewsStory[],
  filters: NewsFilters,
  markets: readonly MarketDto[],
  placements: ReadonlyMap<string, StoryPlacement> = new Map(),
): readonly NewsStory[] {
  const placed = (story: NewsStory, filter: string, pick: keyof PlacementSets): boolean =>
    filter === ALL || (placements.get(story.key)?.[pick].has(filter) ?? false);
  const countryOf = (marketId: string): string | undefined =>
    markets.find((market) => String(market.marketId) === marketId)?.country;
  return stories.filter(
    (story) =>
      (filters.market === ALL || story.marketIds.includes(filters.market)) &&
      (filters.country === ALL ||
        story.marketIds.some((id) => countryOf(id) === filters.country)) &&
      (filters.instrument === ALL || story.instrumentIds.includes(filters.instrument)) &&
      (filters.category === ALL || story.lead.category === filters.category) &&
      (filters.sentiment === ALL || story.lead.sentiment === filters.sentiment) &&
      (filters.importance === ALL ||
        IMPORTANCE_RANK[story.lead.importance] >= IMPORTANCE_RANK[filters.importance]) &&
      (!filters.heldOnly || story.isHeld) &&
      placed(story, filters.sector, 'sectorIds') &&
      placed(story, filters.industry, 'industryIds') &&
      placed(story, filters.group, 'groupIds'),
  );
}

export const isNewsFiltered = (filters: NewsFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(DEFAULT_NEWS_FILTERS);

// How old the newest story is, against how old it may be before the feed counts as behind.
export function feedAge(
  stories: readonly NewsStory[],
  nowMs: number,
): { readonly minutes: number } | null {
  const newest = stories[0];
  return newest === undefined
    ? null
    : { minutes: Math.floor((nowMs - time(newest.lead)) / 60_000) };
}

export function describeAge(minutes: number): string {
  if (minutes < 60) return `${String(minutes)} min`;
  if (minutes < 48 * 60) return `${String(Math.floor(minutes / 60))} h`;
  return `${String(Math.floor(minutes / 1440))} days`;
}
