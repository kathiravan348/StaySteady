// Preview (UI spec 7.8): where the conditions as written would have triggered on recent bars.
// This is not a backtest — no sizing, costs or capital — only the points the rules would have fired.

import type { PriceBarDto, RuleNodeDto, RuleOperandDto } from '../../../../data/schemas';
import type { IndicatorSeries, OhlcPoint } from '../../../../shared/indicators/indicators';
import {
  averageTrueRange,
  bollingerBands,
  exponentialMovingAverage,
  movingAverageConvergenceDivergence,
  relativeStrengthIndex,
  simpleMovingAverage,
  stochasticOscillator,
} from '../../../../shared/indicators/indicators';

export interface PreviewBar {
  readonly time: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export function toPreviewBars(bars: readonly PriceBarDto[]): readonly PreviewBar[] {
  return bars.map((bar) => ({
    time: String(bar.timestamp).slice(0, 10),
    open: Number(bar.open),
    high: Number(bar.high),
    low: Number(bar.low),
    close: Number(bar.close),
    volume: bar.volume,
  }));
}

function operandKey(operand: RuleOperandDto): string {
  if (operand.kind === 'price') return `p:${operand.field}`;
  if (operand.kind === 'number') return `n:${String(operand.value)}`;
  return `i:${operand.indicator}:${String(operand.period)}`;
}

// Each distinct operand is computed once per preview and reused across every bar and condition.
function buildSeries(operand: RuleOperandDto, bars: readonly PreviewBar[]): IndicatorSeries {
  if (operand.kind === 'number') return bars.map(() => operand.value);
  if (operand.kind === 'price') return bars.map((bar) => bar[operand.field]);

  const closes = bars.map((bar) => bar.close);
  const volumes = bars.map((bar) => bar.volume);
  const ohlc: readonly OhlcPoint[] = bars.map((bar) => ({
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }));
  const { period } = operand;

  switch (operand.indicator) {
    case 'sma':
      return simpleMovingAverage(closes, period);
    case 'ema':
      return exponentialMovingAverage(closes, period);
    case 'rsi':
      return relativeStrengthIndex(closes, period);
    case 'macd':
      return movingAverageConvergenceDivergence(closes).macd;
    case 'atr':
      return averageTrueRange(ohlc, period);
    case 'stochastic_k':
      return stochasticOscillator(ohlc, period).k;
    case 'bollinger_upper':
      return bollingerBands(closes, period).upper;
    case 'bollinger_lower':
      return bollingerBands(closes, period).lower;
    case 'volume_sma':
      return simpleMovingAverage(volumes, period);
  }
}

type SeriesCache = Map<string, IndicatorSeries>;

function seriesFor(
  operand: RuleOperandDto,
  bars: readonly PreviewBar[],
  cache: SeriesCache,
): IndicatorSeries {
  const key = operandKey(operand);
  const existing = cache.get(key);
  if (existing !== undefined) return existing;
  const built = buildSeries(operand, bars);
  cache.set(key, built);
  return built;
}

function isTrue(
  node: RuleNodeDto,
  index: number,
  bars: readonly PreviewBar[],
  cache: SeriesCache,
): boolean {
  if (node.node === 'group') {
    // An empty group never fires: nothing has been asked for.
    if (node.children.length === 0) return false;
    return node.combinator === 'all'
      ? node.children.every((child) => isTrue(child, index, bars, cache))
      : node.children.some((child) => isTrue(child, index, bars, cache));
  }

  const left = seriesFor(node.left, bars, cache);
  const right = seriesFor(node.right, bars, cache);
  const l = left[index];
  const r = right[index];
  if (l === null || l === undefined || r === null || r === undefined) return false;

  if (node.comparator === 'greater_than') return l > r;
  if (node.comparator === 'less_than') return l < r;

  // Crossings need the previous bar, so the first bar can never cross.
  const prevL = left[index - 1];
  const prevR = right[index - 1];
  if (prevL === null || prevL === undefined || prevR === null || prevR === undefined) return false;
  return node.comparator === 'crosses_above' ? prevL <= prevR && l > r : prevL >= prevR && l < r;
}

export interface PreviewSignal {
  readonly index: number;
  readonly time: string;
  readonly price: number;
  readonly kind: 'entry' | 'exit';
}

export interface PreviewResult {
  readonly bars: readonly PreviewBar[];
  readonly signals: readonly PreviewSignal[];
  readonly entryCount: number;
  readonly exitCount: number;
}

// Rules are evaluated over the whole history so indicators have their warm-up, then only the recent
// window is shown. Slicing first would leave a 200-period average null on every bar.
export function recentWindow(result: PreviewResult, barCount: number): PreviewResult {
  const start = Math.max(0, result.bars.length - barCount);
  const bars = result.bars.slice(start);
  const signals = result.signals
    .filter((signal) => signal.index >= start)
    .map((signal) => ({ ...signal, index: signal.index - start }));
  return {
    bars,
    signals,
    entryCount: signals.filter((signal) => signal.kind === 'entry').length,
    exitCount: signals.filter((signal) => signal.kind === 'exit').length,
  };
}

// Entries only fire while flat and exits only while holding, so the preview reads as alternating
// trades rather than a stream of repeated signals.
export function previewSignals(
  entry: RuleNodeDto,
  exit: RuleNodeDto,
  bars: readonly PreviewBar[],
): PreviewResult {
  const cache: SeriesCache = new Map();
  const signals: PreviewSignal[] = [];
  let holding = false;

  bars.forEach((bar, index) => {
    if (!holding && isTrue(entry, index, bars, cache)) {
      signals.push({ index, time: bar.time, price: bar.close, kind: 'entry' });
      holding = true;
      return;
    }
    if (holding && isTrue(exit, index, bars, cache)) {
      signals.push({ index, time: bar.time, price: bar.close, kind: 'exit' });
      holding = false;
    }
  });

  return {
    bars,
    signals,
    entryCount: signals.filter((signal) => signal.kind === 'entry').length,
    exitCount: signals.filter((signal) => signal.kind === 'exit').length,
  };
}
