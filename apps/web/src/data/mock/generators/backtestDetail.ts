// Backtest result detail (UI spec 7.10): the equity and drawdown series, monthly returns and the
// assembled detail response. Series are seeded per backtest and scaled so the curve ends at the
// saved final capital and its worst drawdown matches the saved metric.

import { Decimal } from 'decimal.js';

import type { BacktestDetailDto, BacktestResultDto } from '../../schemas';
import { BacktestDetailSchema } from '../../schemas';
import { buildMetricGroups } from './backtestMetricGroups';
import { buildBreakdowns, buildCosts, buildValidation } from './backtestMetrics';
import type { MockGeneratorContext } from './mockContext';
import { generateStrategies } from './trading';
import { parseGenerated } from './validated';

const WEEK_MS = 7 * 86_400_000;

export interface EquityPoint {
  readonly date: string;
  readonly equity: number;
  readonly benchmark: number | null;
  readonly drawdownPercent: number;
}

function weeklyDates(startDate: string, endDate: string): string[] {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const dates: string[] = [];
  for (let time = start; time <= end; time += WEEK_MS) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  const last = new Date(end).toISOString().slice(0, 10);
  if (dates[dates.length - 1] !== last) dates.push(last);
  return dates;
}

function worstDrawdown(values: readonly number[]): number {
  let peak = values[0] ?? 0;
  let worst = 0;
  values.forEach((value) => {
    peak = Math.max(peak, value);
    worst = Math.min(worst, peak === 0 ? 0 : ((value - peak) / peak) * 100);
  });
  return worst;
}

// Random walk with a drift that lands exactly on the target return; amplitude is then tuned so the
// worst drawdown matches the saved metric, which keeps chart and headline numbers consistent.
function buildPath(
  shocks: readonly number[],
  start: number,
  totalReturnPercent: number,
  amplitude: number,
): number[] {
  const drift = Math.pow(1 + totalReturnPercent / 100, 1 / shocks.length);
  let value = start;
  const path = [start];
  shocks.forEach((shock) => {
    value = value * drift * (1 + shock * amplitude);
    path.push(value);
  });
  // Rescale so the final value is exact after the noise.
  const target = start * (1 + totalReturnPercent / 100);
  const last = path[path.length - 1] ?? target;
  const correction = last === 0 ? 1 : target / last;
  return path.map((point, index) => point * (1 + (correction - 1) * (index / (path.length - 1))));
}

function buildEquityCurve(
  ctx: MockGeneratorContext,
  result: BacktestResultDto,
): { readonly points: EquityPoint[]; readonly dates: string[] } {
  const dates = weeklyDates(result.startDate, result.endDate);
  const stream = ctx.random.fork(`backtest-equity:${result.id}`);
  const shocks = dates.slice(1).map(() => stream.normal(0, 1));
  const benchmarkShocks = dates.slice(1).map(() => stream.normal(0, 1));
  const start = new Decimal(result.initialCapital.amount).toNumber();

  // Tune the noise until the worst drawdown is close to the saved maximum drawdown.
  let amplitude = 0.01;
  let path = buildPath(shocks, start, result.totalReturnPercent, amplitude);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const measured = Math.abs(worstDrawdown(path));
    if (measured === 0 || Math.abs(measured - result.metrics.maxDrawdown) < 0.4) break;
    amplitude *= result.metrics.maxDrawdown / measured;
    path = buildPath(shocks, start, result.totalReturnPercent, amplitude);
  }

  // The benchmark keeps a steadier climb: roughly half the return, less noise.
  const benchmarkPath = buildPath(
    benchmarkShocks,
    start,
    result.totalReturnPercent * 0.45,
    amplitude * 0.6,
  );

  let peak = path[0] ?? start;
  const points = dates.map((date, index): EquityPoint => {
    const equity = path[index] ?? start;
    peak = Math.max(peak, equity);
    return {
      date,
      equity: Number(equity.toFixed(2)),
      benchmark: Number((benchmarkPath[index] ?? start).toFixed(2)),
      drawdownPercent: Number(Math.min(0, ((equity - peak) / peak) * 100).toFixed(2)),
    };
  });
  return { points, dates };
}

function monthlyReturns(
  points: readonly EquityPoint[],
): { year: number; month: number; returnPercent: number }[] {
  const lastByMonth = new Map<string, EquityPoint>();
  points.forEach((point) => {
    lastByMonth.set(point.date.slice(0, 7), point);
  });
  const months = [...lastByMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return months.flatMap(([key, point], index) => {
    const previous = months[index - 1]?.[1];
    if (previous === undefined) return [];
    const [year, month] = key.split('-');
    return [
      {
        year: Number(year),
        month: Number(month),
        returnPercent: Number(
          (((point.equity - previous.equity) / previous.equity) * 100).toFixed(2),
        ),
      },
    ];
  });
}

export function generateBacktestDetail(
  ctx: MockGeneratorContext,
  result: BacktestResultDto,
): BacktestDetailDto {
  const { points } = buildEquityCurve(ctx, result);
  const strategy = generateStrategies(ctx).find((item) => item.id === result.strategyId);
  const instrumentIds = strategy?.universe ?? [];
  const months = monthlyReturns(points);

  return parseGenerated(
    BacktestDetailSchema,
    {
      backtestId: result.id,
      benchmarkLabel: 'SPY · SPDR S&P 500 ETF Trust',
      equityCurve: points,
      monthlyReturns: months,
      metricGroups: buildMetricGroups(result, points),
      breakdowns: buildBreakdowns(ctx, result, months, instrumentIds),
      costs: buildCosts(result),
      validation: buildValidation(ctx, result, points),
      instrumentIds,
      // The mock price history has no filled-in bars; a real run would report them here.
      estimatedBars: 0,
    },
    'backtestDetail',
  );
}
