// Strategy server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { StrategyDto } from '../schemas';
import { StrategySchema } from '../schemas';
import { apiGet } from './apiClient';

const StrategyListSchema = z.array(StrategySchema);

export function useStrategies(): UseQueryResult<StrategyDto[]> {
  return useQuery({
    queryKey: ['strategies'],
    queryFn: ({ signal }) => apiGet('/api/v1/strategies', StrategyListSchema, signal),
  });
}
