// Liquidity plan (E-07): reserve, ladder, commitments, withdrawal phase and automation ceiling.
// A save returns the whole view, which replaces the cache (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { LiquidityPlanInput, LiquidityViewDto } from '../schemas';
import { LiquidityViewSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const KEY = ['planning', 'liquidity'] as const;

export function useLiquidityPlan(): UseQueryResult<LiquidityViewDto> {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/planning/liquidity', LiquidityViewSchema, signal),
  });
}

export function useSaveLiquidityPlan(): UseMutationResult<
  LiquidityViewDto,
  Error,
  LiquidityPlanInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (plan: LiquidityPlanInput) =>
      apiSend('PUT', '/api/v1/planning/liquidity', { plan }, LiquidityViewSchema),
    onSuccess: (data) => {
      client.setQueryData(KEY, data);
    },
  });
}
