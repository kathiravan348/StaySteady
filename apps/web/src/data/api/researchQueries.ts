// Backtest server state (UI spec 7.9, 7.10). A started run is polled until it finishes, so the
// setup screen can show progress and offer cancellation.

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  BacktestConfigDto,
  BacktestDetailDto,
  BacktestResultDto,
  BacktestRunDto,
  DataCoverageDto,
  MarketCostDefaultsDto,
} from '../schemas';
import {
  BacktestDetailSchema,
  BacktestResultSchema,
  BacktestRunSchema,
  DataCoverageListSchema,
  MarketCostDefaultsListSchema,
} from '../schemas';

import { apiGet, apiSend } from './apiClient';

const SLOW_STALE_MS = 5 * 60_000;
const RUN_POLL_MS = 400;

// Trades come from the mock generator's own shape, so they are validated here rather than in M-02.
const BacktestTradeSchema = z.object({
  id: z.string().min(1),
  backtestId: z.string().min(1),
  instrumentSymbol: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  entryDate: z.string().min(1),
  exitDate: z.string().min(1),
  returnPercent: z.number(),
  pnlAmount: z.string().min(1),
  isOutlier: z.boolean(),
});
const BacktestTradeListSchema = z.array(BacktestTradeSchema);
export type BacktestTradeDto = z.infer<typeof BacktestTradeSchema>;

export function useBacktests(): UseQueryResult<BacktestResultDto[]> {
  return useQuery({
    queryKey: ['backtests'],
    queryFn: ({ signal }) => apiGet('/api/v1/backtests', z.array(BacktestResultSchema), signal),
  });
}

export function useBacktest(backtestId: string | null): UseQueryResult<BacktestResultDto> {
  return useQuery({
    queryKey: ['backtests', backtestId],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/backtests/${encodeURIComponent(backtestId ?? '')}`,
        BacktestResultSchema,
        signal,
      ),
    enabled: backtestId !== null,
  });
}

// Shared with the comparison screen, which loads several details at once through useQueries.
export function backtestDetailQueryOptions(backtestId: string) {
  return queryOptions({
    queryKey: ['backtests', backtestId, 'detail'],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/backtests/${encodeURIComponent(backtestId)}/detail`,
        BacktestDetailSchema,
        signal,
      ),
    staleTime: SLOW_STALE_MS,
  });
}

export function useBacktestDetail(backtestId: string | null): UseQueryResult<BacktestDetailDto> {
  return useQuery({
    ...backtestDetailQueryOptions(backtestId ?? ''),
    enabled: backtestId !== null,
  });
}

// `count` comes from the result's own trade total, so the list matches the headline metric.
export function useBacktestTrades(
  backtestId: string | null,
  count?: number,
): UseQueryResult<BacktestTradeDto[]> {
  return useQuery({
    queryKey: ['backtests', backtestId, 'trades', count ?? null],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/backtests/${encodeURIComponent(backtestId ?? '')}/trades${count === undefined ? '' : `?count=${count}`}`,
        BacktestTradeListSchema,
        signal,
      ),
    enabled: backtestId !== null,
    staleTime: SLOW_STALE_MS,
  });
}

export function useBacktestCostDefaults(): UseQueryResult<MarketCostDefaultsDto[]> {
  return useQuery({
    queryKey: ['backtests', 'cost-defaults'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/backtests/cost-defaults', MarketCostDefaultsListSchema, signal),
    staleTime: SLOW_STALE_MS,
  });
}

// Coverage for the instruments currently selected; skipped while nothing is selected.
export function useDataCoverage(
  instrumentIds: readonly string[],
): UseQueryResult<DataCoverageDto[]> {
  const ids = [...instrumentIds].sort().join(',');
  return useQuery({
    queryKey: ['backtests', 'data-coverage', ids],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/backtests/data-coverage?instrumentIds=${encodeURIComponent(ids)}`,
        DataCoverageListSchema,
        signal,
      ),
    enabled: ids !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export function useStartBacktestRun(): UseMutationResult<BacktestRunDto, Error, BacktestConfigDto> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (config: BacktestConfigDto) =>
      apiSend('POST', '/api/v1/backtests/runs', config, BacktestRunSchema),
    onSuccess: (run) => {
      client.setQueryData(['backtests', 'run', run.id], run);
    },
  });
}

export function useBacktestRun(runId: string | null): UseQueryResult<BacktestRunDto> {
  return useQuery({
    queryKey: ['backtests', 'run', runId],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/backtests/runs/${encodeURIComponent(runId ?? '')}`,
        BacktestRunSchema,
        signal,
      ),
    enabled: runId !== null,
    // Poll while the run is still moving; stop once it has finished.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'running' ? RUN_POLL_MS : false;
    },
  });
}

export function useCancelBacktestRun(): UseMutationResult<BacktestRunDto, Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      apiSend(
        'DELETE',
        `/api/v1/backtests/runs/${encodeURIComponent(runId)}`,
        undefined,
        BacktestRunSchema,
      ),
    onSuccess: (run) => {
      client.setQueryData(['backtests', 'run', run.id], run);
    },
  });
}
