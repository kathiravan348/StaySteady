// Backtest setup state (UI spec 7.9): reference data, the configuration being edited, the checks
// that run before starting, and the run itself.

import { useMemo, useState } from 'react';

import {
  useBacktestCostDefaults,
  useBacktestRun,
  useCancelBacktestRun,
  useDataCoverage,
  useInstruments,
  useMarkets,
  useStartBacktestRun,
  useStrategies,
} from '../../../data/api';
import type {
  BacktestConfigDto,
  InstrumentDto,
  MarketCostDefaultsDto,
  MarketDto,
  StrategyDto,
} from '../../../data/schemas';
import type { RangePreset } from './model/backtestConfig';
import {
  benchmarksForInstruments,
  costsForMarket,
  defaultConfig,
  primaryMarketId,
} from './model/backtestConfig';
import type { SetupCheck } from './model/backtestWarnings';
import { runSetupChecks } from './model/backtestWarnings';

export interface SetupReady {
  readonly status: 'ready';
  readonly strategies: readonly StrategyDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly costDefaults: readonly MarketCostDefaultsDto[];
  readonly config: BacktestConfigDto;
  readonly strategy: StrategyDto;
  readonly checks: readonly SetupCheck[];
  readonly isCoverageLoading: boolean;
  readonly rangePreset: RangePreset;
  readonly update: (change: Partial<BacktestConfigDto>) => void;
  readonly setRangePreset: (preset: RangePreset) => void;
  readonly selectStrategy: (strategyId: string) => void;
  readonly resetCosts: () => void;
}

export type SetupState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | SetupReady;

export interface RunState {
  readonly runId: string | null;
  readonly start: (config: BacktestConfigDto) => void;
  readonly cancel: () => void;
  readonly isStarting: boolean;
  readonly isCancelling: boolean;
  readonly error: string | null;
}

interface EditState {
  readonly config: BacktestConfigDto | null;
  readonly rangePreset: RangePreset;
}

export function useBacktestSetup(initialStrategyId: string | null): SetupState {
  const strategies = useStrategies();
  const instruments = useInstruments();
  const markets = useMarkets();
  const costDefaults = useBacktestCostDefaults();
  const [edit, setEdit] = useState<EditState>({ config: null, rangePreset: '3Y' });
  const today = new Date().toISOString().slice(0, 10);

  const queries = [strategies, instruments, markets, costDefaults];
  const failed = queries.find((query) => query.isError && query.data === undefined);

  const baseConfig = useMemo(() => {
    if (
      strategies.data === undefined ||
      instruments.data === undefined ||
      costDefaults.data === undefined
    ) {
      return null;
    }
    const strategy =
      strategies.data.find((item) => item.id === initialStrategyId) ?? strategies.data[0];
    return strategy === undefined
      ? null
      : defaultConfig({
          strategy,
          instruments: instruments.data,
          costDefaults: costDefaults.data,
          today,
        });
  }, [strategies.data, instruments.data, costDefaults.data, initialStrategyId, today]);

  const config = edit.config ?? baseConfig;
  const coverage = useDataCoverage(config?.instrumentIds ?? []);
  const liveCosts = useMemo(
    () =>
      config === null || instruments.data === undefined || costDefaults.data === undefined
        ? undefined
        : (costsForMarket(
            primaryMarketId(config.instrumentIds, instruments.data),
            costDefaults.data,
          ) ?? undefined),
    [config, instruments.data, costDefaults.data],
  );
  const checks = useMemo(
    () =>
      config === null || costDefaults.data === undefined
        ? []
        : runSetupChecks({
            config,
            coverage: coverage.data ?? [],
            costDefaults: costDefaults.data,
            liveCosts,
          }),
    [config, coverage.data, costDefaults.data, liveCosts],
  );

  if (failed !== undefined) {
    return {
      status: 'error',
      message: failed.error?.message ?? 'Unknown error',
      retry: () => {
        queries.forEach((query) => {
          void query.refetch();
        });
      },
    };
  }
  if (
    config === null ||
    strategies.data === undefined ||
    instruments.data === undefined ||
    markets.data === undefined ||
    costDefaults.data === undefined
  ) {
    return { status: 'loading' };
  }
  const strategy = strategies.data.find((item) => item.id === config.strategyId);
  if (strategy === undefined) return { status: 'loading' };

  const setConfig = (next: BacktestConfigDto, rangePreset?: RangePreset): void => {
    setEdit((current) => ({
      config: next,
      rangePreset: rangePreset ?? current.rangePreset,
    }));
  };

  return {
    status: 'ready',
    strategies: strategies.data,
    instruments: instruments.data,
    markets: markets.data,
    costDefaults: costDefaults.data,
    config,
    strategy,
    checks,
    isCoverageLoading: coverage.isFetching,
    rangePreset: edit.rangePreset,
    update: (change) => {
      const next = { ...config, ...change };
      // Changing the universe changes which markets need a benchmark.
      const withBenchmarks =
        change.instrumentIds === undefined
          ? next
          : {
              ...next,
              benchmarks: benchmarksForInstruments(
                next.instrumentIds,
                instruments.data ?? [],
                costDefaults.data ?? [],
              ),
            };
      setConfig(
        withBenchmarks,
        change.startDate !== undefined || change.endDate !== undefined ? 'Custom' : undefined,
      );
    },
    setRangePreset: (preset) => {
      setEdit((current) => ({ ...current, rangePreset: preset }));
    },
    selectStrategy: (strategyId) => {
      const nextStrategy = strategies.data?.find((item) => item.id === strategyId);
      const nextConfig =
        nextStrategy === undefined
          ? null
          : defaultConfig({
              strategy: nextStrategy,
              instruments: instruments.data ?? [],
              costDefaults: costDefaults.data ?? [],
              today,
            });
      if (nextConfig !== null) setConfig(nextConfig, '3Y');
    },
    resetCosts: () => {
      if (liveCosts !== undefined) setConfig({ ...config, costs: liveCosts });
    },
  };
}

// The run is separate state: starting one does not change the configuration being edited.
export function useBacktestRunControl(): RunState & {
  readonly run: ReturnType<typeof useBacktestRun>;
} {
  const [runId, setRunId] = useState<string | null>(null);
  const start = useStartBacktestRun();
  const cancel = useCancelBacktestRun();
  const run = useBacktestRun(runId);

  return {
    run,
    runId,
    isStarting: start.isPending,
    isCancelling: cancel.isPending,
    error: start.error?.message ?? cancel.error?.message ?? null,
    start: (config) => {
      start.mutate(config, { onSuccess: (started) => setRunId(started.id) });
    },
    cancel: () => {
      if (runId !== null) cancel.mutate(runId);
    },
  };
}
