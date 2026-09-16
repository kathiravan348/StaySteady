// Which runs the comparison screen is showing (UI spec 7.11). The selection lives in the URL, so a
// comparison can be linked to and reloaded.

import { useQueries } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { backtestDetailQueryOptions, useBacktests } from '../../../data/api';
import type { BacktestResultDto } from '../../../data/schemas';
import type { ComparedRun } from './model/compareModel';
import { MAX_RUNS } from './model/compareModel';

export interface CompareState {
  readonly selectedIds: readonly string[];
  readonly available: readonly BacktestResultDto[];
  readonly runs: readonly ComparedRun[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly retry: () => void;
  readonly toggle: (backtestId: string) => void;
  readonly clear: () => void;
}

// A saved run's label has to survive two runs of the same strategy, so the period disambiguates it.
function runLabel(result: BacktestResultDto, strategyName: string): string {
  return `${strategyName} · ${result.startDate.slice(0, 7)} to ${result.endDate.slice(0, 7)}`;
}

export function useCompareRuns(): CompareState {
  const [params, setParams] = useSearchParams();
  const backtests = useBacktests();

  // An absent `runs` key means "nothing chosen yet", so the screen opens on a useful default. An
  // empty one means the reader cleared the selection on purpose, which must stay cleared.
  const hasExplicitSelection = params.has('runs');
  const requestedIds = (params.get('runs') ?? '')
    .split(',')
    .filter((id) => id !== '')
    .slice(0, MAX_RUNS);
  const selectedIds = hasExplicitSelection
    ? requestedIds
    : (backtests.data ?? []).slice(0, 2).map((result) => String(result.id));

  const details = useQueries({
    queries: selectedIds.map((id) => backtestDetailQueryOptions(id)),
  });

  const runs = selectedIds.flatMap((id, index): ComparedRun[] => {
    const result = backtests.data?.find((item) => String(item.id) === id);
    const detail = details[index]?.data;
    return result === undefined || detail === undefined
      ? []
      : [{ result, detail, label: runLabel(result, detail.settings.strategyName) }];
  });

  const setSelection = (ids: readonly string[]): void => {
    setParams({ runs: ids.join(',') }, { replace: true });
  };

  return {
    selectedIds,
    available: backtests.data ?? [],
    runs,
    isLoading: backtests.isPending || details.some((query) => query.isPending),
    error:
      backtests.error?.message ??
      details.find((query) => query.error !== null)?.error?.message ??
      null,
    retry: () => {
      void backtests.refetch();
      details.forEach((query) => {
        void query.refetch();
      });
    },
    toggle: (backtestId) => {
      if (selectedIds.includes(backtestId)) {
        setSelection(selectedIds.filter((id) => id !== backtestId));
        return;
      }
      if (selectedIds.length >= MAX_RUNS) return;
      setSelection([...selectedIds, backtestId]);
    },
    clear: () => {
      setSelection([]);
    },
  };
}
