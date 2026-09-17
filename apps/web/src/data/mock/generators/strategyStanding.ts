// Strategy standing and correlation (E-08; requirements 28, 33). Each strategy's value series is the
// sum of its own open positions on each business day of the criteria window, valued as reports value
// them. Drawdown and rolling Sharpe come from that series; underperformance is how far the live
// return trails its backtest. A strategy with no open positions keeps its last recorded measurement.

import { Decimal } from 'decimal.js';

import type {
  StrategyLibraryEntryDto,
  StrategyLifecycleDto,
  StrategyStandingViewDto,
} from '../../schemas';
import { StrategyStandingViewSchema } from '../../schemas';
import { addDays } from './reportValuation';
import type { ValuationContext } from './reportValuation';
import { parseGenerated } from './validated';

const DEFAULT_WINDOW_DAYS = 90;
const TRADING_DAYS_PER_YEAR = 252;
const CORRELATION_WARNING = 0.7;

function businessDays(today: string, windowDays: number): string[] {
  const days: string[] = [];
  for (let offset = windowDays; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(date);
  }
  return days;
}

function returnsOf(values: readonly Decimal[]): number[] {
  return values.slice(1).flatMap((value, index) => {
    const previous = values[index];
    return previous === undefined || previous.isZero()
      ? []
      : [value.dividedBy(previous).minus(1).toNumber()];
  });
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sharpe(returns: readonly number[]): number {
  const average = mean(returns);
  const deviation = Math.sqrt(mean(returns.map((value) => (value - average) ** 2)));
  return deviation === 0 ? 0 : (average / deviation) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

function maxDrawdownPercent(values: readonly Decimal[]): number {
  let peak = new Decimal(0);
  let worst = 0;
  for (const value of values) {
    peak = Decimal.max(peak, value);
    if (!peak.isZero())
      worst = Math.max(worst, peak.minus(value).dividedBy(peak).times(100).toNumber());
  }
  return worst;
}

function correlation(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  if (length < 2) return 0;
  const x = a.slice(0, length);
  const y = b.slice(0, length);
  const mx = mean(x);
  const my = mean(y);
  let covariance = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < length; i += 1) {
    const dx = (x[i] ?? 0) - mx;
    const dy = (y[i] ?? 0) - my;
    covariance += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  return vx === 0 || vy === 0 ? 0 : Math.max(-1, Math.min(1, covariance / Math.sqrt(vx * vy)));
}

const round = (value: number, places: number): number => Number(value.toFixed(places));

export function buildStrategyStanding(
  v: ValuationContext,
  library: readonly StrategyLibraryEntryDto[],
  lifecycles: readonly StrategyLifecycleDto[],
  today: string,
): StrategyStandingViewDto {
  const series = new Map<string, number[]>();
  const standings = library.map((entry) => {
    const id = String(entry.strategyId);
    const lifecycle = lifecycles.find((item) => String(item.strategyId) === id);
    const criteria = lifecycle?.criteria ?? null;
    const windowDays = criteria?.rollingWindowDays ?? DEFAULT_WINDOW_DAYS;
    const owned = v.holdings.filter((holding) => holding.openedByStrategyId === id);
    let measured = null;
    let source: 'live' | 'at_demotion' | 'none' = 'none';
    if (owned.length > 0) {
      const valuesOver = (days: number): Decimal[] =>
        businessDays(today, days).map((date) =>
          owned.reduce(
            (sum, holding) => sum.plus(v.holdingValue(holding, date, 'USD')),
            new Decimal(0),
          ),
        );
      const values = valuesOver(windowDays);
      const returns = returnsOf(values);
      // Correlation compares every strategy over the same dates.
      series.set(
        id,
        windowDays === DEFAULT_WINDOW_DAYS ? returns : returnsOf(valuesOver(DEFAULT_WINDOW_DAYS)),
      );
      measured = {
        drawdownPercent: round(maxDrawdownPercent(values), 2),
        rollingSharpe: round(sharpe(returns), 2),
        underperformancePoints: round(
          Math.max(0, -(entry.divergence?.deltaPercentagePoints ?? 0)),
          2,
        ),
      };
      source = 'live';
    } else {
      const lastDemotion = [...(lifecycle?.history ?? [])]
        .reverse()
        .find((change) => change.kind === 'demotion');
      if (lastDemotion?.measured) {
        measured = lastDemotion.measured;
        source = 'at_demotion';
      }
    }
    const breaches =
      criteria === null || measured === null
        ? []
        : [
            ...(measured.drawdownPercent > criteria.maxDrawdownPercent
              ? [
                  `Drawdown ${measured.drawdownPercent.toFixed(1)}% beyond ${String(criteria.maxDrawdownPercent)}%`,
                ]
              : []),
            ...(measured.rollingSharpe < criteria.minRollingSharpe
              ? [
                  `Sharpe ${measured.rollingSharpe.toFixed(2)} below ${criteria.minRollingSharpe.toFixed(2)}`,
                ]
              : []),
            ...(measured.underperformancePoints > criteria.maxUnderperformancePoints
              ? [
                  `Trails backtest by ${measured.underperformancePoints.toFixed(1)} points, limit ${String(criteria.maxUnderperformancePoints)}`,
                ]
              : []),
          ];
    const lastReview = lifecycle?.lastReviewedAt ?? null;
    const nextReviewOn =
      criteria === null || lastReview === null
        ? null
        : addDays(String(lastReview).slice(0, 10), criteria.reviewEveryDays);
    return {
      strategyId: id,
      name: entry.name,
      stage: entry.stage,
      source,
      measured,
      breaches,
      nextReviewOn,
      isReviewOverdue: nextReviewOn !== null && nextReviewOn < today,
    };
  });

  const ids = [...series.keys()];
  return parseGenerated(
    StrategyStandingViewSchema,
    {
      standings,
      correlation: {
        windowDays: DEFAULT_WINDOW_DAYS,
        strategyIds: ids,
        names: ids.map(
          (id) => library.find((entry) => String(entry.strategyId) === id)?.name ?? id,
        ),
        matrix: ids.map((a) =>
          ids.map((b) => round(correlation(series.get(a) ?? [], series.get(b) ?? []), 2)),
        ),
      },
      correlationWarning: CORRELATION_WARNING,
    },
    'strategy standing',
  );
}
