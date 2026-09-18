// Creating and saving strategies (T-01). A create or save changes the strategy list, the library
// and Backtest Setup's picker, so every strategy query is refreshed afterwards.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  CreateStrategyRequestDto,
  SavedStrategyDto,
  StrategyDraftDto,
  StrategyTemplateDto,
} from '../schemas';
import { SavedStrategySchema, StrategyDraftSchema, StrategyTemplateListSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

export function useStrategyTemplates(): UseQueryResult<StrategyTemplateDto[]> {
  return useQuery({
    queryKey: ['strategies', 'templates'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/strategies/templates', StrategyTemplateListSchema, signal),
    staleTime: Infinity,
  });
}

function refreshStrategyLists(client: QueryClient): void {
  void client.invalidateQueries({ queryKey: ['strategies'], exact: true });
  void client.invalidateQueries({ queryKey: ['strategies', 'library'] });
}

export function useCreateStrategy(): UseMutationResult<
  StrategyDraftDto,
  Error,
  CreateStrategyRequestDto
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateStrategyRequestDto) =>
      apiSend('POST', '/api/v1/strategies', request, StrategyDraftSchema),
    onSuccess: (draft) => {
      client.setQueryData(['strategies', String(draft.strategyId), 'draft'], draft);
      void client.invalidateQueries({
        queryKey: ['strategies', String(draft.strategyId), 'versions'],
      });
      refreshStrategyLists(client);
    },
  });
}

// The draft goes as the editor holds it; the server's schema checks the name and timeframe.
export interface SaveStrategyVariables {
  readonly strategyId: string;
  readonly draft: StrategyDraftDto;
  readonly summary: string;
}

export function useSaveStrategy(): UseMutationResult<
  SavedStrategyDto,
  Error,
  SaveStrategyVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, draft, summary }: SaveStrategyVariables) =>
      apiSend(
        'PUT',
        `/api/v1/strategies/${encodeURIComponent(strategyId)}/draft`,
        { draft, summary },
        SavedStrategySchema,
      ),
    onSuccess: (saved, { strategyId }) => {
      client.setQueryData(['strategies', strategyId, 'draft'], saved.draft);
      client.setQueryData(['strategies', strategyId, 'versions'], saved.versions);
      refreshStrategyLists(client);
    },
  });
}
