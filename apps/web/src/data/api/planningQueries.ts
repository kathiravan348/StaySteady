// Planning server state (UI spec 7.17): allocation targets, goals, projections and trade previews.
// Writes return the full resource, which replaces the cache (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  AllocationPlanInput,
  AllocationViewDto,
  GoalInput,
  GoalViewDto,
  ProjectionDto,
  ProjectionRequestDto,
  ReportCurrencyDto,
  TradePreviewDto,
  TradePreviewRequestDto,
} from '../schemas';
import {
  AllocationViewSchema,
  GoalViewListSchema,
  ProjectionSchema,
  TradePreviewSchema,
} from '../schemas';
import { apiGet, apiSend } from './apiClient';

const allocationKey = (currency: ReportCurrencyDto | null): readonly string[] => [
  'planning',
  'allocation',
  currency ?? 'base',
];
const GOALS_KEY = ['planning', 'goals'] as const;

// Null currency uses the configured base currency.
export function useAllocationPlan(
  currency: ReportCurrencyDto | null,
): UseQueryResult<AllocationViewDto> {
  const search = currency === null ? '' : `?currency=${currency}`;
  return useQuery({
    queryKey: allocationKey(currency),
    queryFn: ({ signal }) =>
      apiGet(`/api/v1/planning/allocation${search}`, AllocationViewSchema, signal),
  });
}

export function useSaveAllocationPlan(
  currency: ReportCurrencyDto | null,
): UseMutationResult<
  AllocationViewDto,
  Error,
  { readonly plan: AllocationPlanInput; readonly reason: string }
> {
  const client = useQueryClient();
  const search = currency === null ? '' : `?currency=${currency}`;
  return useMutation({
    mutationFn: (variables: { readonly plan: AllocationPlanInput; readonly reason: string }) =>
      apiSend('PUT', `/api/v1/planning/allocation${search}`, variables, AllocationViewSchema),
    onSuccess: (view) => {
      client.setQueryData(allocationKey(currency), view);
      void client.invalidateQueries({ queryKey: ['planning', 'allocation'] });
    },
  });
}

export function useGoals(): UseQueryResult<GoalViewDto[]> {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/planning/goals', GoalViewListSchema, signal),
  });
}

export type GoalAction =
  | { readonly kind: 'create'; readonly goal: Omit<GoalInput, 'id'> }
  | { readonly kind: 'update'; readonly goal: GoalInput }
  | { readonly kind: 'delete'; readonly id: string };

export function useGoalAction(): UseMutationResult<GoalViewDto[], Error, GoalAction> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: GoalAction) => {
      switch (action.kind) {
        case 'create':
          return apiSend('POST', '/api/v1/planning/goals', action.goal, GoalViewListSchema);
        case 'update':
          return apiSend(
            'PUT',
            `/api/v1/planning/goals/${encodeURIComponent(action.goal.id)}`,
            action.goal,
            GoalViewListSchema,
          );
        case 'delete':
          return apiSend(
            'DELETE',
            `/api/v1/planning/goals/${encodeURIComponent(action.id)}`,
            undefined,
            GoalViewListSchema,
          );
      }
    },
    onSuccess: (goals) => {
      client.setQueryData(GOALS_KEY, goals);
    },
  });
}

// Projections and previews are calculations the owner asks for, so they are mutations, not queries.
export function useProjection(): UseMutationResult<ProjectionDto, Error, ProjectionRequestDto> {
  return useMutation({
    mutationFn: (request: ProjectionRequestDto) =>
      apiSend('POST', '/api/v1/planning/projection', request, ProjectionSchema),
  });
}

export function useTradePreview(): UseMutationResult<
  TradePreviewDto,
  Error,
  TradePreviewRequestDto
> {
  return useMutation({
    mutationFn: (request: TradePreviewRequestDto) =>
      apiSend('POST', '/api/v1/planning/trade-preview', request, TradePreviewSchema),
  });
}
