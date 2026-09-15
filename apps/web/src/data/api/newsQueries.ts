// News and calendar server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { CalendarEventDto, NewsItemDto } from '../schemas';
import { CalendarEventSchema, NewsItemSchema } from '../schemas';
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
