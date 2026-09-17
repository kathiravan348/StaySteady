// TanStack Query server state hooks for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  ScreenerFilterCriteria,
  ScreenerPreset,
  ScreenerSearchResult,
} from '../schemas/screener';
import { ScreenerPresetSchema, ScreenerSearchResultSchema } from '../schemas/screener';
import { apiGet, apiSend } from './apiClient';

export const SCREENER_SEARCH_KEY = ['screener', 'search'] as const;
export const SCREENER_PRESETS_KEY = ['screener', 'presets'] as const;

export function useScreenerSearch(
  criteria: ScreenerFilterCriteria,
): UseQueryResult<ScreenerSearchResult> {
  return useQuery({
    queryKey: [...SCREENER_SEARCH_KEY, criteria],
    queryFn: () =>
      apiSend('POST', '/api/v1/markets/screener/search', criteria, ScreenerSearchResultSchema),
  });
}

export function useScreenerPresets(): UseQueryResult<readonly ScreenerPreset[]> {
  return useQuery({
    queryKey: SCREENER_PRESETS_KEY,
    queryFn: ({ signal }) =>
      apiGet('/api/v1/markets/screener/presets', z.array(ScreenerPresetSchema), signal),
  });
}
