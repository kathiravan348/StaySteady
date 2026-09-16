// Alerts Centre server state (UI spec 7.19). The list refreshes every minute so an escalation that
// comes due is shown without a reload; an action returns the whole list (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { AlertActionRequestDto, AlertGroupDto } from '../schemas';
import { AlertGroupListSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const KEY = ['alerts', 'centre'] as const;
const REFRESH_MS = 60_000;

export function useAlertCentre(): UseQueryResult<AlertGroupDto[]> {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/alerts/centre', AlertGroupListSchema, signal),
    refetchInterval: REFRESH_MS,
  });
}

export interface AlertActionVariables extends AlertActionRequestDto {
  readonly id: string;
}

export function useAlertAction(): UseMutationResult<AlertGroupDto[], Error, AlertActionVariables> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: AlertActionVariables) =>
      apiSend(
        'POST',
        `/api/v1/alerts/centre/${encodeURIComponent(id)}/action`,
        { action, note },
        AlertGroupListSchema,
      ),
    onSuccess: (list) => {
      client.setQueryData(KEY, list);
    },
  });
}
