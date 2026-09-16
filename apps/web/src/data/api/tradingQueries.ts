// Strategy and signal server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  SignalDto,
  StrategyDraftDto,
  StrategyDto,
  StrategyLibraryEntryDto,
  StrategyVersionDto,
} from '../schemas';
import {
  SignalSchema,
  StrategyDraftSchema,
  StrategyLibraryListSchema,
  StrategySchema,
  StrategyVersionListSchema,
} from '../schemas';
import { apiGet } from './apiClient';

const StrategyListSchema = z.array(StrategySchema);
const SignalListSchema = z.array(SignalSchema);

// UI spec 7.8 — the rule tree and settings behind one strategy, and its saved versions.
export function useStrategyDraft(strategyId: string | null): UseQueryResult<StrategyDraftDto> {
  return useQuery({
    queryKey: ['strategies', strategyId, 'draft'],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/strategies/${encodeURIComponent(strategyId ?? '')}/draft`,
        StrategyDraftSchema,
        signal,
      ),
    enabled: strategyId !== null,
  });
}

export function useStrategyVersions(
  strategyId: string | null,
): UseQueryResult<StrategyVersionDto[]> {
  return useQuery({
    queryKey: ['strategies', strategyId, 'versions'],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/strategies/${encodeURIComponent(strategyId ?? '')}/versions`,
        StrategyVersionListSchema,
        signal,
      ),
    enabled: strategyId !== null,
  });
}

// UI spec 7.7 — strategies joined to their allocation, live result, divergence and last run.
export function useStrategyLibrary(): UseQueryResult<StrategyLibraryEntryDto[]> {
  return useQuery({
    queryKey: ['strategies', 'library'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/strategies/library', StrategyLibraryListSchema, signal),
  });
}

export function useStrategies(): UseQueryResult<StrategyDto[]> {
  return useQuery({
    queryKey: ['strategies'],
    queryFn: ({ signal }) => apiGet('/api/v1/strategies', StrategyListSchema, signal),
  });
}

export function useSignals(): UseQueryResult<SignalDto[]> {
  return useQuery({
    queryKey: ['signals'],
    queryFn: ({ signal }) => apiGet('/api/v1/signals', SignalListSchema, signal),
  });
}
