// Decision journal server state (requirements 29; UI spec 19.1). A review returns the whole journal,
// which replaces the cache (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { JournalDto } from '../schemas';
import { JournalSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const KEY = ['journal'] as const;

export function useJournal(): UseQueryResult<JournalDto> {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/journal', JournalSchema, signal),
  });
}

export interface JournalReviewVariables {
  readonly id: string;
  readonly note: string;
}

export function useJournalReview(): UseMutationResult<JournalDto, Error, JournalReviewVariables> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: JournalReviewVariables) =>
      apiSend('POST', `/api/v1/journal/${encodeURIComponent(id)}/review`, { note }, JournalSchema),
    onSuccess: (journal) => {
      client.setQueryData(KEY, journal);
    },
  });
}
