// Strategy and signal server state.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  ApprovalDecisionDto,
  ApprovalRequestDto,
  SignalDto,
  SignalFeedEntryDto,
  StrategyDraftDto,
  StrategyDto,
  StrategyLibraryEntryDto,
  StrategyVersionDto,
} from '../schemas';
import {
  ApprovalQueueListSchema,
  SignalFeedListSchema,
  SignalSchema,
  StrategyDraftSchema,
  StrategyLibraryListSchema,
  StrategySchema,
  StrategyVersionListSchema,
} from '../schemas';
import { apiGet, apiSend } from './apiClient';

const StrategyListSchema = z.array(StrategySchema);
const SignalListSchema = z.array(SignalSchema);

// UI spec 7.12 — every signal with what became of it, and the pending decisions with their impact.
export function useSignalFeed(): UseQueryResult<SignalFeedEntryDto[]> {
  return useQuery({
    queryKey: ['signals', 'feed'],
    queryFn: ({ signal }) => apiGet('/api/v1/signals/feed', SignalFeedListSchema, signal),
  });
}

export function useApprovalQueue(): UseQueryResult<ApprovalRequestDto[]> {
  return useQuery({
    queryKey: ['approvals', 'queue'],
    queryFn: ({ signal }) => apiGet('/api/v1/approvals/queue', ApprovalQueueListSchema, signal),
  });
}

export interface DecideApprovalVariables {
  readonly approvalId: string;
  readonly decision: ApprovalDecisionDto;
}

// The server returns the whole queue, which replaces the cache (decision 33).
export function useDecideApproval(): UseMutationResult<
  ApprovalRequestDto[],
  Error,
  DecideApprovalVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, decision }: DecideApprovalVariables) =>
      apiSend(
        'POST',
        `/api/v1/approvals/${encodeURIComponent(approvalId)}/decide`,
        decision,
        ApprovalQueueListSchema,
      ),
    onSuccess: (queue) => {
      client.setQueryData(['approvals', 'queue'], queue);
      // The overview's pending count and the signals feed both read from these.
      void client.invalidateQueries({ queryKey: ['trading', 'approvals'] });
      void client.invalidateQueries({ queryKey: ['signals'] });
    },
  });
}

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
