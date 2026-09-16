// Strategy and signal server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { SignalDto, StrategyDto, StrategyLibraryEntryDto } from '../schemas';
import { SignalSchema, StrategyLibraryListSchema, StrategySchema } from '../schemas';
import { apiGet } from './apiClient';

const StrategyListSchema = z.array(StrategySchema);
const SignalListSchema = z.array(SignalSchema);

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
