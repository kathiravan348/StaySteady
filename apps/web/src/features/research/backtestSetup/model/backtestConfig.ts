// Backtest configuration defaults and range presets (UI spec 7.9). Pure.

import { Decimal } from 'decimal.js';

import type {
  BacktestConfigDto,
  BacktestGranularityDto,
  CostAssumptionsDto,
  InstrumentDto,
  MarketCostDefaultsDto,
  StrategyDto,
} from '../../../../data/schemas';

// Daily history starts here in the mock data (PRICE_HISTORY_ORIGIN_DATE).
export const HISTORY_ORIGIN_DATE = '2022-01-03';

export const RANGE_PRESETS = ['1Y', '3Y', '5Y', 'All history', 'Custom'] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const GRANULARITIES: readonly BacktestGranularityDto[] = ['1d', '1h', '15m'];
export const GRANULARITY_LABELS: Readonly<Record<BacktestGranularityDto, string>> = {
  '1d': 'Daily bars',
  '1h': 'Hourly bars',
  '15m': '15-minute bars',
};

// Periods worth knowing about when they fall inside a tested range (UI spec 7.9).
export interface UnusualPeriod {
  readonly id: string;
  readonly label: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly note: string;
}

export const UNUSUAL_PERIODS: readonly UnusualPeriod[] = [
  {
    id: 'bear-2022',
    label: '2022 drawdown',
    startDate: '2022-01-03',
    endDate: '2022-10-14',
    note: 'A long falling market; trend strategies look unusually good or bad across it.',
  },
  {
    id: 'rate-shock-2023',
    label: 'March 2023 rate shock',
    startDate: '2023-03-06',
    endDate: '2023-03-31',
    note: 'Sharp rate repricing with several gap opens.',
  },
  {
    id: 'vol-2024',
    label: 'August 2024 volatility spike',
    startDate: '2024-08-01',
    endDate: '2024-08-16',
    note: 'A short, violent unwind; slippage assumptions matter more than usual here.',
  },
];

const DAY_MS = 86_400_000;

export function shiftYears(date: string, years: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCFullYear(shifted.getUTCFullYear() + years);
  return shifted.toISOString().slice(0, 10);
}

export function daysBetween(startDate: string, endDate: string): number {
  return Math.round(
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS,
  );
}

export function rangeForPreset(
  preset: RangePreset,
  today: string,
  current: { readonly startDate: string; readonly endDate: string },
): { readonly startDate: string; readonly endDate: string } {
  switch (preset) {
    case '1Y':
      return { startDate: shiftYears(today, -1), endDate: today };
    case '3Y':
      return { startDate: shiftYears(today, -3), endDate: today };
    case '5Y':
      return { startDate: shiftYears(today, -5), endDate: today };
    case 'All history':
      return { startDate: HISTORY_ORIGIN_DATE, endDate: today };
    case 'Custom':
      return current;
  }
}

// The market most of the chosen instruments trade in; its configuration pre-fills the costs.
export function primaryMarketId(
  instrumentIds: readonly string[],
  instruments: readonly InstrumentDto[],
): string | null {
  const counts = new Map<string, number>();
  instrumentIds.forEach((id) => {
    const marketId = instruments.find((item) => item.id === id)?.marketId;
    if (marketId !== undefined) counts.set(marketId, (counts.get(marketId) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function costsForMarket(
  marketId: string | null,
  defaults: readonly MarketCostDefaultsDto[],
): CostAssumptionsDto | null {
  const match = defaults.find((item) => item.marketId === marketId) ?? defaults[0];
  return match?.costs ?? null;
}

export function benchmarksForInstruments(
  instrumentIds: readonly string[],
  instruments: readonly InstrumentDto[],
  defaults: readonly MarketCostDefaultsDto[],
): BacktestConfigDto['benchmarks'] {
  const marketIds = [
    ...new Set(
      instrumentIds.flatMap((id) => {
        const marketId = instruments.find((item) => item.id === id)?.marketId;
        return marketId === undefined ? [] : [marketId];
      }),
    ),
  ];
  return marketIds.map((marketId) => ({
    marketId,
    instrumentId:
      defaults.find((item) => item.marketId === marketId)?.benchmarkInstrumentId ?? null,
  })) as BacktestConfigDto['benchmarks'];
}

export interface DefaultConfigInput {
  readonly strategy: StrategyDto;
  readonly instruments: readonly InstrumentDto[];
  readonly costDefaults: readonly MarketCostDefaultsDto[];
  readonly today: string;
}

// A ready-to-run configuration: the strategy's own universe, three years of history and the costs
// live configuration uses for that market.
export function defaultConfig({
  strategy,
  instruments,
  costDefaults,
  today,
}: DefaultConfigInput): BacktestConfigDto | null {
  const instrumentIds = strategy.universe.filter((id) =>
    instruments.some((instrument) => instrument.id === id),
  );
  const marketId = primaryMarketId(instrumentIds, instruments);
  const costs = costsForMarket(marketId, costDefaults);
  if (instrumentIds.length === 0 || costs === null) return null;
  const range = rangeForPreset('3Y', today, { startDate: HISTORY_ORIGIN_DATE, endDate: today });
  return {
    strategyId: strategy.id,
    startDate: range.startDate,
    endDate: range.endDate,
    instrumentIds,
    initialCapital: { amount: new Decimal(100_000).toFixed(2), currency: 'USD' },
    granularity: '1d',
    benchmarks: benchmarksForInstruments(instrumentIds, instruments, costDefaults),
    costs,
  } as BacktestConfigDto;
}
