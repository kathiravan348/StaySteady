// Independent reconciliation status (E-05). Writes return every account (decision 33); resolving a
// mismatch resumes automation, so the approval queue and alerts are refreshed.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { ReconciliationAccountDto } from '../schemas/reconciliation';
import { ReconciliationViewSchema } from '../schemas/reconciliation';
import { apiGet, apiSend } from './apiClient';

const KEY = ['health', 'reconciliation'] as const;

export function useReconciliation(): UseQueryResult<ReconciliationAccountDto[]> {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) =>
      apiGet('/api/v1/health/reconciliation', ReconciliationViewSchema, signal),
  });
}

export function useRunReconciliation(): UseMutationResult<
  ReconciliationAccountDto[],
  Error,
  string
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (brokerId: string) =>
      apiSend(
        'POST',
        `/api/v1/health/reconciliation/${encodeURIComponent(brokerId)}/run`,
        {},
        ReconciliationViewSchema,
      ),
    onSuccess: (data) => {
      client.setQueryData(KEY, data);
    },
  });
}

export interface ResolveReconciliationVariables {
  readonly brokerId: string;
  readonly reason: string;
}

export function useResolveReconciliation(): UseMutationResult<
  ReconciliationAccountDto[],
  Error,
  ResolveReconciliationVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ brokerId, reason }: ResolveReconciliationVariables) =>
      apiSend(
        'POST',
        `/api/v1/health/reconciliation/${encodeURIComponent(brokerId)}/resolve`,
        { reason },
        ReconciliationViewSchema,
      ),
    onSuccess: (data) => {
      client.setQueryData(KEY, data);
      void client.invalidateQueries({ queryKey: ['approvals', 'queue'] });
      void client.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
