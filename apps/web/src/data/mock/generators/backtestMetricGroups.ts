// Metric groups for a backtest result (UI spec 8.2). Every metric carries a plain-language
// explanation, and the ones that mislead carry the limitation that matters.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { BacktestResultDto, MetricGroupSchema } from '../../schemas';
import type { EquityPoint } from './backtestDetail';
import { currencyDecimals } from './values';

type MetricGroupInput = z.input<typeof MetricGroupSchema>;

const percent = (value: number): string => `${value.toFixed(2)}%`;

const WEEKS_PER_YEAR = 52;

function weeklyReturns(points: readonly EquityPoint[]): number[] {
  return points.flatMap((point, index) => {
    const previous = points[index - 1];
    return previous === undefined ? [] : [(point.equity - previous.equity) / previous.equity];
  });
}

function annualisedVolatility(points: readonly EquityPoint[]): number {
  const returns = weeklyReturns(points);
  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(WEEKS_PER_YEAR) * 100;
}

function downsideDeviation(points: readonly EquityPoint[]): number {
  const losses = weeklyReturns(points).filter((value) => value < 0);
  if (losses.length === 0) return 0;
  const variance = losses.reduce((sum, value) => sum + value ** 2, 0) / losses.length;
  return Math.sqrt(variance) * Math.sqrt(WEEKS_PER_YEAR) * 100;
}

interface DrawdownWindow {
  readonly startDate: string;
  readonly endDate: string;
  readonly recoveryWeeks: number | null;
}

// The peak before the deepest trough, the trough itself, and how long it took to get back.
function worstDrawdownWindow(points: readonly EquityPoint[]): DrawdownWindow {
  let worstIndex = 0;
  points.forEach((point, index) => {
    if (point.drawdownPercent < (points[worstIndex]?.drawdownPercent ?? 0)) worstIndex = index;
  });
  let peakIndex = worstIndex;
  while (peakIndex > 0 && (points[peakIndex]?.drawdownPercent ?? 0) < 0) peakIndex -= 1;
  const recoveryIndex = points.findIndex(
    (point, index) => index > worstIndex && point.drawdownPercent >= 0,
  );
  return {
    startDate: points[peakIndex]?.date ?? points[0]?.date ?? '',
    endDate: points[worstIndex]?.date ?? '',
    recoveryWeeks: recoveryIndex < 0 ? null : recoveryIndex - worstIndex,
  };
}

function benchmarkReturnPercent(points: readonly EquityPoint[]): number {
  const first = points[0]?.benchmark ?? 0;
  const last = points[points.length - 1]?.benchmark ?? 0;
  return first === 0 ? 0 : ((last - first) / first) * 100;
}

function returnGroup(result: BacktestResultDto, points: readonly EquityPoint[]): MetricGroupInput {
  const currency = result.initialCapital.currency;
  const benchmark = benchmarkReturnPercent(points);
  const total = new Decimal(result.totalReturn.amount).toFixed(currencyDecimals(currency));
  return {
    id: 'returns',
    title: 'Return',
    metrics: [
      {
        id: 'total-return',
        label: 'Total return',
        value: `${total} ${currency} (${percent(result.totalReturnPercent)})`,
        explanation: 'Final capital minus starting capital, after the modelled costs.',
        limitation: null,
      },
      {
        id: 'cagr',
        label: 'Annualised return (CAGR)',
        value: percent(result.metrics.cagr),
        explanation: 'The constant yearly rate that would produce the same final capital.',
        limitation:
          'It says nothing about the path taken; two runs with the same CAGR can feel very different.',
      },
      {
        id: 'benchmark',
        label: 'Return versus benchmark',
        value: `${percent(result.totalReturnPercent - benchmark)} excess (benchmark ${percent(benchmark)})`,
        explanation:
          'How much better or worse than simply holding the benchmark over the same period.',
        limitation: 'The benchmark is not risk-matched; beating it can mean taking more risk.',
      },
    ],
  };
}

function riskGroup(result: BacktestResultDto, points: readonly EquityPoint[]): MetricGroupInput {
  const volatility = annualisedVolatility(points);
  const drawdown = worstDrawdownWindow(points);
  return {
    id: 'risk',
    title: 'Risk',
    metrics: [
      {
        id: 'max-drawdown',
        label: 'Maximum drawdown',
        value: `${percent(-result.metrics.maxDrawdown)} (${drawdown.startDate} to ${drawdown.endDate})`,
        explanation: 'The deepest fall from a previous peak during the test.',
        limitation: null,
      },
      {
        id: 'recovery',
        label: 'Recovery after the worst drawdown',
        value:
          drawdown.recoveryWeeks === null
            ? 'Not recovered by the end of the test'
            : `${drawdown.recoveryWeeks} weeks`,
        explanation: 'How long the strategy took to reach its previous peak again.',
        limitation: null,
      },
      {
        id: 'volatility',
        label: 'Volatility (annualised)',
        value: percent(volatility),
        explanation: 'How much weekly results varied, scaled to a year.',
        limitation: 'Treats upside and downside moves the same.',
      },
      {
        id: 'downside-deviation',
        label: 'Downside deviation',
        value: percent(downsideDeviation(points)),
        explanation: 'Like volatility, but counting only losing weeks.',
        limitation: null,
      },
      {
        id: 'sharpe',
        label: 'Sharpe ratio',
        value: result.metrics.sharpeRatio.toFixed(2),
        explanation: 'Return per unit of total variation; higher is steadier for the same return.',
        limitation:
          'Assumes returns are well behaved; it flatters strategies with rare large losses.',
      },
      {
        id: 'sortino',
        label: 'Sortino ratio',
        value: result.metrics.sortinoRatio.toFixed(2),
        explanation: 'Like Sharpe, but it only penalises downside variation.',
        limitation: null,
      },
      {
        id: 'calmar',
        label: 'Calmar ratio',
        value: (
          result.metrics.calmarRatio ?? result.metrics.cagr / result.metrics.maxDrawdown
        ).toFixed(2),
        explanation: 'Annualised return divided by the maximum drawdown.',
        limitation: null,
      },
      {
        id: 'var',
        label: 'Value at risk (weekly, 95%)',
        value: percent(-1.65 * (volatility / Math.sqrt(WEEKS_PER_YEAR))),
        explanation: 'A rough weekly loss that should be exceeded about one week in twenty.',
        limitation:
          'An estimate from past variation only; it says nothing about how bad the worst week could be.',
      },
    ],
  };
}

function tradeGroup(result: BacktestResultDto): MetricGroupInput {
  return {
    id: 'trades',
    title: 'Trades',
    metrics: [
      {
        id: 'total-trades',
        label: 'Total trades',
        value: String(result.metrics.totalTrades),
        explanation: 'How many round trips the strategy took.',
        limitation: 'Few trades make every other metric less reliable.',
      },
      {
        id: 'win-rate',
        label: 'Win rate',
        value: percent(result.metrics.winRate),
        explanation: 'Share of trades that made money.',
        limitation: 'A high win rate can still lose money if the losses are larger than the wins.',
      },
      {
        id: 'profit-factor',
        label: 'Profit factor',
        value: result.metrics.profitFactor.toFixed(2),
        explanation: 'Gross profit divided by gross loss; above 1 means profitable before costs.',
        limitation: null,
      },
    ],
  };
}

export function buildMetricGroups(
  result: BacktestResultDto,
  points: readonly EquityPoint[],
): MetricGroupInput[] {
  return [returnGroup(result, points), riskGroup(result, points), tradeGroup(result)];
}
