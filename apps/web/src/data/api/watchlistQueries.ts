// Watchlist server state (UI spec 7.4 membership, 7.5).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { WatchlistDto } from '../schemas';
import { WatchlistSchema } from '../schemas';
import { apiGet } from './apiClient';

const WatchlistListSchema = z.array(WatchlistSchema);

export function useWatchlists(): UseQueryResult<WatchlistDto[]> {
  return useQuery({
    queryKey: ['watchlists'],
    queryFn: ({ signal }) => apiGet('/api/v1/watchlists', WatchlistListSchema, signal),
  });
}
