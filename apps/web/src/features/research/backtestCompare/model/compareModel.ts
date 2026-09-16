// Comparing saved backtest runs (UI spec 7.11). Pure: normalised curves, metric rows and the
// settings diff.

import { Decimal } from 'decimal.js';

import type {
  BacktestDetailDto,
  BacktestResultDto,
  BacktestSettingsDto,
} from '../../../../data/schemas';

export const MIN_RUNS = 2;
export const MAX_RUNS = 4;
export const NORMALISED_START = 100;

export interface ComparedRun {
  readonly result: BacktestResultDto;
  readonly detail: BacktestDetailDto;
  readonly label: string;
}

export interface NormalisedCurves {
  readonly dates: readonly string[];
  readonly series: readonly { readonly name: string; readonly values: readonly number[] }[];
}

// Runs can cover different periods: the axis is every date any run has, and each run's value is
// carried forward from its last known point so the lines stay comparable.
export function normaliseCurves(runs: readonly ComparedRun[]): NormalisedCurves {
  const dates = [
    ...new Set(runs.flatMap((run) => run.detail.equityCurve.map((point) => point.date))),
  ].sort();
  const series = runs.map((run) => {
    const byDate = new Map(run.detail.equityCurve.map((point) => [point.date, point.equity]));
    const start = run.detail.equityCurve[0]?.equity ?? 0;
    let carried: number | null = null;
    const values = dates.map((date) => {
      const equity = byDate.get(date);
      if (equity !== undefined) carried = equity;
      return carried === null || start === 0
        ? NORMALISED_START
        : Number(((carried / start) * NORMALISED_START).toFixed(2));
    });
    return { name: run.label, values };
  });
  return { dates, series };
}

// 'neutral' covers plain counts such as the number of trades, where neither end is better and
// ranking the runs would assert something the number does not say.
export type MetricDirection = 'higher-is-better' | 'lower-is-better' | 'neutral';

export interface MetricComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly direction: MetricDirection;
  readonly values: readonly {
    readonly runId: string;
    readonly display: string;
    readonly numeric: number;
  }[];
  // Every run holding the extreme value, so runs that tie are all marked rather than just the
  // first one found.
  readonly bestRunIds: readonly string[];
  readonly worstRunIds: readonly string[];
  // The gap between the extremes, always a magnitude and never signed.
  readonly spread: string;
}

interface MetricSpec {
  readonly id: string;
  readonly label: string;
  readonly direction: MetricDirection;
  readonly pick: (run: ComparedRun) => number;
  readonly format: (value: number) => string;
  // Used for the spread where the value format carries a sign of its own, as drawdown does.
  readonly formatGap?: (value: number) => string;
}

const percent = (value: number): string => `${value.toFixed(2)}%`;
const ratio = (value: number): string => value.toFixed(2);
const count = (value: number): string => String(value);

// Every run holding this exact value, so a tie marks all of them rather than only the first.
function idsAtValue(
  values: readonly { readonly runId: string; readonly numeric: number }[],
  target: number,
): readonly string[] {
  return values.filter((value) => value.numeric === target).map((value) => value.runId);
}

const METRICS: readonly MetricSpec[] = [
  {
    id: 'total-return',
    label: 'Total return',
    direction: 'higher-is-better',
    pick: (run) => run.result.totalReturnPercent,
    format: percent,
  },
  {
    id: 'cagr',
    label: 'Annualised return',
    direction: 'higher-is-better',
    pick: (run) => run.result.metrics.cagr,
    format: percent,
  },
  {
    id: 'max-drawdown',
    label: 'Maximum drawdown',
    direction: 'lower-is-better',
    pick: (run) => run.result.metrics.maxDrawdown,
    format: (value) => `-${value.toFixed(2)}%`,
    formatGap: percent,
  },
  {
    id: 'sharpe',
    label: 'Sharpe ratio',
    direction: 'higher-is-better',
    pick: (run) => run.result.metrics.sharpeRatio,
    format: ratio,
  },
  {
    id: 'sortino',
    label: 'Sortino ratio',
    direction: 'higher-is-better',
    pick: (run) => run.result.metrics.sortinoRatio,
    format: ratio,
  },
  {
    id: 'win-rate',
    label: 'Win rate',
    direction: 'higher-is-better',
    pick: (run) => run.result.metrics.winRate,
    format: percent,
  },
  {
    id: 'profit-factor',
    label: 'Profit factor',
    direction: 'higher-is-better',
    pick: (run) => run.result.metrics.profitFactor,
    format: ratio,
  },
  {
    id: 'trades',
    label: 'Trades',
    direction: 'neutral',
    pick: (run) => run.result.metrics.totalTrades,
    format: count,
  },
  {
    id: 'costs',
    label: 'Costs as share of gross',
    direction: 'lower-is-better',
    pick: (run) => run.detail.costs.costsAsPercentOfGross,
    format: percent,
  },
  {
    id: 'out-of-sample',
    label: 'Out-of-sample return',
    direction: 'higher-is-better',
    pick: (run) => run.detail.validation.outOfSample.returnPercent,
    format: percent,
  },
  {
    id: 'top-trade-share',
    label: 'Profit from top trades',
    direction: 'lower-is-better',
    pick: (run) => run.detail.validation.topTradeSharePercent,
    format: percent,
  },
];

export function compareMetrics(runs: readonly ComparedRun[]): readonly MetricComparisonRow[] {
  return METRICS.map((spec) => {
    const values = runs.map((run) => {
      const numeric = spec.pick(run);
      return { runId: String(run.result.id), numeric, display: spec.format(numeric) };
    });
    const numbers = values.map((value) => value.numeric);
    const high = Math.max(...numbers);
    const low = Math.min(...numbers);
    const isFlat = high === low;
    const best = spec.direction === 'lower-is-better' ? low : high;
    const worst = spec.direction === 'lower-is-better' ? high : low;
    const isRanked = spec.direction !== 'neutral' && !isFlat;
    const formatGap = spec.formatGap ?? spec.format;

    return {
      id: spec.id,
      label: spec.label,
      direction: spec.direction,
      values,
      bestRunIds: isRanked ? idsAtValue(values, best) : [],
      worstRunIds: isRanked ? idsAtValue(values, worst) : [],
      spread: isFlat ? 'Same' : formatGap(high - low),
    };
  });
}

export interface SettingsDiffRow {
  readonly id: string;
  readonly label: string;
  readonly values: readonly { readonly runId: string; readonly display: string }[];
  readonly isDifferent: boolean;
}

function settingsFields(
  settings: BacktestSettingsDto,
): readonly { readonly id: string; readonly label: string; readonly display: string }[] {
  return [
    {
      id: 'strategy',
      label: 'Strategy',
      display: `${settings.strategyName} v${settings.strategyVersion}`,
    },
    { id: 'period', label: 'Period', display: `${settings.startDate} to ${settings.endDate}` },
    {
      id: 'universe',
      label: 'Instruments',
      display:
        settings.instrumentSymbols.length === 0 ? 'None' : settings.instrumentSymbols.join(', '),
    },
    {
      id: 'capital',
      label: 'Starting capital',
      display: `${new Decimal(settings.initialCapital.amount).toFixed(2)} ${settings.initialCapital.currency}`,
    },
    { id: 'granularity', label: 'Data granularity', display: settings.granularity },
    { id: 'benchmark', label: 'Benchmark', display: settings.benchmarkLabel ?? 'None' },
    { id: 'commission', label: 'Commission', display: `${settings.commissionBps} bps` },
    { id: 'slippage', label: 'Slippage', display: `${settings.slippageBps} bps` },
    { id: 'conversion', label: 'Currency conversion', display: `${settings.fxConversionBps} bps` },
  ];
}

// Every configuration field, with the ones that are not identical across runs flagged.
export function compareSettings(runs: readonly ComparedRun[]): readonly SettingsDiffRow[] {
  const perRun = runs.map((run) => ({
    runId: String(run.result.id),
    fields: settingsFields(run.detail.settings),
  }));
  const template = perRun[0]?.fields ?? [];
  return template.map((field, index) => {
    const values = perRun.map((run) => ({
      runId: run.runId,
      display: run.fields[index]?.display ?? '—',
    }));
    return {
      id: field.id,
      label: field.label,
      values,
      isDifferent: new Set(values.map((value) => value.display)).size > 1,
    };
  });
}
