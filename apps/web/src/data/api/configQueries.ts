// Configuration server state (UI spec 7.18). Writes return the whole list, which replaces the cache
// (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { MarketConfigEntryDto, MarketConfigInput } from '../schemas';
import { MarketConfigListSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const MARKETS_KEY = ['config', 'markets'] as const;

export function useMarketConfigs(): UseQueryResult<MarketConfigEntryDto[]> {
  return useQuery({
    queryKey: MARKETS_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/config/markets', MarketConfigListSchema, signal),
  });
}

export interface SaveMarketConfigVariables {
  readonly isNew: boolean;
  readonly config: MarketConfigInput;
  readonly reason: string;
}

export function useSaveMarketConfig(): UseMutationResult<
  MarketConfigEntryDto[],
  Error,
  SaveMarketConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ isNew, config, reason }: SaveMarketConfigVariables) =>
      isNew
        ? apiSend('POST', '/api/v1/config/markets', { config, reason }, MarketConfigListSchema)
        : apiSend(
            'PUT',
            `/api/v1/config/markets/${encodeURIComponent(config.marketId)}`,
            { config, reason },
            MarketConfigListSchema,
          ),
    onSuccess: (entries) => {
      client.setQueryData(MARKETS_KEY, entries);
    },
  });
}

export interface RevertMarketConfigVariables {
  readonly marketId: string;
  readonly version: number;
  readonly reason: string;
}

export function useRevertMarketConfig(): UseMutationResult<
  MarketConfigEntryDto[],
  Error,
  RevertMarketConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ marketId, version, reason }: RevertMarketConfigVariables) =>
      apiSend(
        'POST',
        `/api/v1/config/markets/${encodeURIComponent(marketId)}/revert`,
        { version, reason },
        MarketConfigListSchema,
      ),
    onSuccess: (entries) => {
      client.setQueryData(MARKETS_KEY, entries);
    },
  });
}
