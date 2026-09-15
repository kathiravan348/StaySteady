// Strategy and signal server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { SignalDto, StrategyDto } from '../schemas';
import { SignalSchema, StrategySchema } from '../schemas';
import { apiGet } from './apiClient';

const StrategyListSchema = z.array(StrategySchema);
const SignalListSchema = z.array(SignalSchema);

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
