// News, calendar and corporate-action lists for one position (UI spec 7.3). Pure.

import type { CalendarEventDto, CorporateActionDto, NewsItemDto } from '../../../../data/schemas';

export interface NewsStory {
  readonly item: NewsItemDto;
  readonly sourceCount: number;
}

// The same story from several outlets is shown once, newest version first (UI spec 7.6).
export function selectInstrumentNews(
  items: readonly NewsItemDto[],
  instrumentId: string,
): NewsStory[] {
  const groups = new Map<string, NewsItemDto[]>();
  for (const item of items) {
    if (!item.relatedInstruments.some((id) => id === instrumentId)) {
      continue;
    }
    const key = item.duplicateGroupId ?? item.id;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()]
    .flatMap((group) => {
      const newest = [...group].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
      return newest === undefined ? [] : [{ item: newest, sourceCount: group.length }];
    })
    .sort((a, b) => b.item.publishedAt.localeCompare(a.item.publishedAt));
}

// Calendar events are market-wide: show upcoming events for the instrument's market.
export function selectUpcomingMarketEvents(
  events: readonly CalendarEventDto[],
  marketId: string,
  today: string,
  limit = 6,
): CalendarEventDto[] {
  return events
    .filter((event) => event.marketId === marketId && event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export function sortCorporateActions(actions: readonly CorporateActionDto[]): CorporateActionDto[] {
  return [...actions].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
}
