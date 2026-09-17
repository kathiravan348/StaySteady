// TanStack Query server state hooks for continuity and emergency access (requirements 28; UI spec 19.1).
// Mutations update the query cache directly with the returned view (decisions 22 and 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  ContinuityViewDto,
  RecordDrillRequestDto,
  UpdateInactivityRequestDto,
} from '../schemas/continuity';
import { ContinuityViewSchema } from '../schemas/continuity';
import { apiGet, apiSend } from './apiClient';

const CONTINUITY_KEY = ['continuity'] as const;

export function useContinuity(): UseQueryResult<ContinuityViewDto> {
  return useQuery({
    queryKey: CONTINUITY_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/continuity', ContinuityViewSchema, signal),
  });
}

export function useConfirmNominee(): UseMutationResult<ContinuityViewDto, Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (institutionId: string) =>
      apiSend(
        'POST',
        `/api/v1/continuity/institutions/${encodeURIComponent(institutionId)}/confirm`,
        {},
        ContinuityViewSchema,
      ),
    onSuccess: (updated) => {
      client.setQueryData(CONTINUITY_KEY, updated);
    },
  });
}

export function useRecordDrill(): UseMutationResult<
  ContinuityViewDto,
  Error,
  RecordDrillRequestDto
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (drill: RecordDrillRequestDto) =>
      apiSend('POST', '/api/v1/continuity/drill', drill, ContinuityViewSchema),
    onSuccess: (updated) => {
      client.setQueryData(CONTINUITY_KEY, updated);
    },
  });
}

export function useUpdateInactivity(): UseMutationResult<
  ContinuityViewDto,
  Error,
  UpdateInactivityRequestDto
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (setting: UpdateInactivityRequestDto) =>
      apiSend('PUT', '/api/v1/continuity/inactivity', setting, ContinuityViewSchema),
    onSuccess: (updated) => {
      client.setQueryData(CONTINUITY_KEY, updated);
    },
  });
}

export function useResetHeartbeat(): UseMutationResult<ContinuityViewDto, Error, void> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiSend('POST', '/api/v1/continuity/heartbeat', {}, ContinuityViewSchema),
    onSuccess: (updated) => {
      client.setQueryData(CONTINUITY_KEY, updated);
    },
  });
}
