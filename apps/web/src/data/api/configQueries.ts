// Configuration server state (UI spec 7.18). Writes return the whole list, which replaces the cache
// (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  ConnectionTestResultDto,
  MarketConfigEntryDto,
  MarketConfigInput,
  ProviderConfigEntryDto,
  ProviderConfigInput,
} from '../schemas';
import {
  ConnectionTestResultSchema,
  MarketConfigListSchema,
  ProviderConfigListSchema,
} from '../schemas';
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

const PROVIDERS_KEY = ['config', 'providers'] as const;

export function useProviderConfigs(): UseQueryResult<ProviderConfigEntryDto[]> {
  return useQuery({
    queryKey: PROVIDERS_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/config/providers', ProviderConfigListSchema, signal),
  });
}

export interface SaveProviderConfigVariables {
  readonly isNew: boolean;
  readonly config: ProviderConfigInput;
  readonly reason: string;
}

export function useSaveProviderConfig(): UseMutationResult<
  ProviderConfigEntryDto[],
  Error,
  SaveProviderConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ isNew, config, reason }: SaveProviderConfigVariables) =>
      isNew
        ? apiSend('POST', '/api/v1/config/providers', { config, reason }, ProviderConfigListSchema)
        : apiSend(
            'PUT',
            `/api/v1/config/providers/${encodeURIComponent(config.providerId)}`,
            { config, reason },
            ProviderConfigListSchema,
          ),
    onSuccess: (entries) => {
      client.setQueryData(PROVIDERS_KEY, entries);
    },
  });
}

export interface RevertProviderConfigVariables {
  readonly providerId: string;
  readonly version: number;
  readonly reason: string;
}

export function useRevertProviderConfig(): UseMutationResult<
  ProviderConfigEntryDto[],
  Error,
  RevertProviderConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, version, reason }: RevertProviderConfigVariables) =>
      apiSend(
        'POST',
        `/api/v1/config/providers/${encodeURIComponent(providerId)}/revert`,
        { version, reason },
        ProviderConfigListSchema,
      ),
    onSuccess: (entries) => {
      client.setQueryData(PROVIDERS_KEY, entries);
    },
  });
}

// Tests the configuration as it stands in the form, saved or not. Nothing is cached: a result is
// only true for the moment it was taken.
export function useTestProviderConnection(): UseMutationResult<
  ConnectionTestResultDto,
  Error,
  ProviderConfigInput
> {
  return useMutation({
    mutationFn: (config: ProviderConfigInput) =>
      apiSend('POST', '/api/v1/config/providers/test', { config }, ConnectionTestResultSchema),
  });
}
