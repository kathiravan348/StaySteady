// Backtest server state (UI spec 7.9, 7.10). A started run is polled until it finishes, so the
// setup screen can show progress and offer cancellation.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  BacktestConfigDto,
  BacktestResultDto,
  BacktestRunDto,
  DataCoverageDto,
  MarketCostDefaultsDto,
} from '../schemas';
import {
  BacktestResultSchema,
  BacktestRunSchema,
  DataCoverageListSchema,
  MarketCostDefaultsListSchema,
} from '../schemas';
import { apiGet, apiSend } from './apiClient';

const SLOW_STALE_MS = 5 * 60_000;
const RUN_POLL_MS = 400;

export function useBacktests(): UseQueryResult<BacktestResultDto[]> {
  return useQuery({
    queryKey: ['backtests'],
    queryFn: ({ signal }) => apiGet('/api/v1/backtests', z.array(BacktestResultSchema), signal),
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
