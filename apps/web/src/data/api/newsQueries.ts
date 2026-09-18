// News and calendar server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { CalendarEventDto, InstrumentFeedDto, NewsItemDto } from '../schemas';
import { CalendarEventSchema, InstrumentFeedSchema, NewsItemSchema } from '../schemas';
import { apiGet } from './apiClient';

const NewsListSchema = z.array(NewsItemSchema);
const CalendarListSchema = z.array(CalendarEventSchema);

export function useNewsItems(): UseQueryResult<NewsItemDto[]> {
  return useQuery({
    queryKey: ['news'],
    queryFn: ({ signal }) => apiGet('/api/v1/news', NewsListSchema, signal),
  });
}

export function useCalendarEvents(): UseQueryResult<CalendarEventDto[]> {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: ({ signal }) => apiGet('/api/v1/calendar', CalendarListSchema, signal),
  });
}

// One instrument's research feed (requirements 38): direct and indirect news, filings, corporate
// actions and the events ahead.
export function useInstrumentFeed(instrumentId: string): UseQueryResult<InstrumentFeedDto> {
  return useQuery({
    queryKey: ['news', 'instrument-feed', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/instruments/${encodeURIComponent(instrumentId)}/feed`,
        InstrumentFeedSchema,
        signal,
      ),
    enabled: instrumentId !== '',
  });
}
