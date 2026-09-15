// Watchlist server state (UI spec 7.4 membership, 7.5). Every write returns the full, validated list
// set, which replaces the cache. Reorder, move and delete update the cache first and roll back if
// the request fails.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { WatchlistDto } from '../schemas';
import { WatchlistListSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const WATCHLISTS_KEY = ['watchlists'] as const;

interface RollbackContext {
  readonly previous: WatchlistDto[] | undefined;
}

export type WatchlistMutation<V> = UseMutationResult<WatchlistDto[], Error, V, RollbackContext>;

export function useWatchlists(): UseQueryResult<WatchlistDto[]> {
  return useQuery({
    queryKey: WATCHLISTS_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/watchlists', WatchlistListSchema, signal),
  });
}

function useWatchlistMutation<V>(
  send: (variables: V) => Promise<WatchlistDto[]>,
  optimistic?: (current: readonly WatchlistDto[], variables: V) => WatchlistDto[],
): WatchlistMutation<V> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: send,
    onMutate: async (variables): Promise<RollbackContext> => {
      const previous = client.getQueryData<WatchlistDto[]>(WATCHLISTS_KEY);
      if (optimistic !== undefined && previous !== undefined) {
        await client.cancelQueries({ queryKey: WATCHLISTS_KEY });
        client.setQueryData(WATCHLISTS_KEY, optimistic(previous, variables));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) client.setQueryData(WATCHLISTS_KEY, context.previous);
    },
    onSuccess: (lists) => {
      client.setQueryData(WATCHLISTS_KEY, lists);
    },
  });
}

export function useCreateWatchlist(): WatchlistMutation<string> {
  return useWatchlistMutation((name) =>
    apiSend('POST', '/api/v1/watchlists', { name }, WatchlistListSchema),
  );
}

export function useRenameWatchlist(): WatchlistMutation<{
  readonly id: string;
  readonly name: string;
}> {
  return useWatchlistMutation(({ id, name }) =>
    apiSend('PATCH', `/api/v1/watchlists/${encodeURIComponent(id)}`, { name }, WatchlistListSchema),
  );
}

export interface SetInstrumentsVariables {
  readonly id: string;
  readonly instrumentIds: readonly string[];
}

// Adds, removes and reorders by sending the complete ordered membership.
export function useSetWatchlistInstruments(): WatchlistMutation<SetInstrumentsVariables> {
  return useWatchlistMutation(
    ({ id, instrumentIds }) =>
      apiSend(
        'PATCH',
        `/api/v1/watchlists/${encodeURIComponent(id)}`,
        { instrumentIds },
        WatchlistListSchema,
      ),
    (current, { id, instrumentIds }) =>
      current.map((list) =>
        list.id === id
          ? { ...list, instrumentIds: [...instrumentIds] as WatchlistDto['instrumentIds'] }
          : list,
      ),
  );
}

export function useDeleteWatchlist(): WatchlistMutation<string> {
  return useWatchlistMutation(
    (id) =>
      apiSend(
        'DELETE',
        `/api/v1/watchlists/${encodeURIComponent(id)}`,
        undefined,
        WatchlistListSchema,
      ),
    (current, id) => current.filter((list) => list.id !== id),
  );
}

export interface MoveInstrumentVariables {
  readonly instrumentId: string;
  readonly fromWatchlistId: string;
  readonly toWatchlistId: string;
}

export function useMoveWatchlistInstrument(): WatchlistMutation<MoveInstrumentVariables> {
  return useWatchlistMutation(
    (variables) => apiSend('POST', '/api/v1/watchlists/move', variables, WatchlistListSchema),
    (current, { instrumentId, fromWatchlistId, toWatchlistId }) =>
      current.map((list) => {
        if (list.id === fromWatchlistId && fromWatchlistId !== toWatchlistId) {
          return { ...list, instrumentIds: list.instrumentIds.filter((id) => id !== instrumentId) };
        }
        if (list.id === toWatchlistId && !list.instrumentIds.some((id) => id === instrumentId)) {
          return {
            ...list,
            instrumentIds: [...list.instrumentIds, instrumentId] as WatchlistDto['instrumentIds'],
          };
        }
        return list;
      }),
  );
}
