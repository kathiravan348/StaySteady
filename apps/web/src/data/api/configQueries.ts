// Configuration server state (UI spec 7.18). Writes return the whole list, which replaces the cache
// (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  BrokerConfigEntryDto,
  BrokerConfigInput,
  ConnectionTestResultDto,
  MarketConfigEntryDto,
  MarketConfigInput,
  ProviderConfigEntryDto,
  ProviderConfigInput,
} from '../schemas';
import {
  BrokerConfigListSchema,
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
      // Credential usage is worked out from these references.
      void client.invalidateQueries({ queryKey: CREDENTIALS_KEY });
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
      // Credential usage is worked out from these references.
      void client.invalidateQueries({ queryKey: CREDENTIALS_KEY });
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

const BROKERS_KEY = ['config', 'brokers'] as const;
// Kept in step with settingsConfigQueries, which owns the credentials list.
const CREDENTIALS_KEY = ['config', 'credentials'] as const;

export function useBrokerConfigs(): UseQueryResult<BrokerConfigEntryDto[]> {
  return useQuery({
    queryKey: BROKERS_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/config/brokers', BrokerConfigListSchema, signal),
  });
}

export interface SaveBrokerConfigVariables {
  readonly isNew: boolean;
  readonly config: BrokerConfigInput;
  readonly reason: string;
}

export function useSaveBrokerConfig(): UseMutationResult<
  BrokerConfigEntryDto[],
  Error,
  SaveBrokerConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ isNew, config, reason }: SaveBrokerConfigVariables) =>
      isNew
        ? apiSend('POST', '/api/v1/config/brokers', { config, reason }, BrokerConfigListSchema)
        : apiSend(
            'PUT',
            `/api/v1/config/brokers/${encodeURIComponent(config.brokerId)}`,
            { config, reason },
            BrokerConfigListSchema,
          ),
    onSuccess: (entries) => {
      client.setQueryData(BROKERS_KEY, entries);
      // Credential usage is worked out from these references.
      void client.invalidateQueries({ queryKey: CREDENTIALS_KEY });
    },
  });
}

export interface RevertBrokerConfigVariables {
  readonly brokerId: string;
  readonly version: number;
  readonly reason: string;
}

export function useRevertBrokerConfig(): UseMutationResult<
  BrokerConfigEntryDto[],
  Error,
  RevertBrokerConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ brokerId, version, reason }: RevertBrokerConfigVariables) =>
      apiSend(
        'POST',
        `/api/v1/config/brokers/${encodeURIComponent(brokerId)}/revert`,
        { version, reason },
        BrokerConfigListSchema,
      ),
    onSuccess: (entries) => {
      client.setQueryData(BROKERS_KEY, entries);
      // Credential usage is worked out from these references.
      void client.invalidateQueries({ queryKey: CREDENTIALS_KEY });
    },
  });
}

// Read-only test of the form as it stands: credential, session and account read, never an order.
export function useTestBrokerConnection(): UseMutationResult<
  ConnectionTestResultDto,
  Error,
  BrokerConfigInput
> {
  return useMutation({
    mutationFn: (config: BrokerConfigInput) =>
      apiSend('POST', '/api/v1/config/brokers/test', { config }, ConnectionTestResultSchema),
  });
}
