// Technical indicators over plain number series (UI spec 7.4 indicator set). Pure and domain-free:
// callers convert decimal prices to numbers for display only (decision 4 still governs money).
// Every function returns an array the same length as its input; null marks warm-up positions.

export type IndicatorSeries = readonly (number | null)[];

export interface OhlcPoint {
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export function simpleMovingAverage(values: readonly number[], period: number): IndicatorSeries {
  const result: (number | null)[] = [];
  let sum = 0;
  values.forEach((value, index) => {
    sum += value;
    const dropped = values[index - period];
    if (dropped !== undefined) {
      sum -= dropped;
    }
    result.push(index >= period - 1 ? sum / period : null);
  });
  return result;
}

// Seeded with the simple average of the first `period` values.
export function exponentialMovingAverage(
  values: readonly number[],
  period: number,
): IndicatorSeries {
  const result: (number | null)[] = [];
  const smoothing = 2 / (period + 1);
  let previous: number | null = null;
  let seedSum = 0;
  values.forEach((value, index) => {
    if (previous === null) {
      seedSum += value;
      if (index === period - 1) {
        previous = seedSum / period;
        result.push(previous);
      } else {
        result.push(null);
      }
      return;
    }
    previous = (value - previous) * smoothing + previous;
    result.push(previous);
  });
  return result;
}

export interface BollingerBands {
  readonly upper: IndicatorSeries;
  readonly middle: IndicatorSeries;
  readonly lower: IndicatorSeries;
}

export function bollingerBands(
  values: readonly number[],
  period = 20,
  deviations = 2,
): BollingerBands {
  const middle = simpleMovingAverage(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  middle.forEach((mean, index) => {
    if (mean === null) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const window = values.slice(index - period + 1, index + 1);
    const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    const spread = Math.sqrt(variance) * deviations;
    upper.push(mean + spread);
    lower.push(mean - spread);
  });
  return { upper, middle, lower };
}

// Wilder's smoothing, the standard RSI definition.
export function relativeStrengthIndex(values: readonly number[], period = 14): IndicatorSeries {
  const result: (number | null)[] = values.map(() => null);
  if (values.length <= period) {
    return result;
  }
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = (values[index] ?? 0) - (values[index - 1] ?? 0);
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  const rsi = (): number => (averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss));
  result[period] = rsi();
  for (let index = period + 1; index < values.length; index += 1) {
    const change = (values[index] ?? 0) - (values[index - 1] ?? 0);
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
    result[index] = rsi();
  }
  return result;
}

export interface MacdResult {
  readonly macd: IndicatorSeries;
  readonly signal: IndicatorSeries;
  readonly histogram: IndicatorSeries;
}

export function movingAverageConvergenceDivergence(
  values: readonly number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  const fastEma = exponentialMovingAverage(values, fast);
  const slowEma = exponentialMovingAverage(values, slow);
  const macd = fastEma.map((value, index) => {
    const slowValue = slowEma[index];
    return value === null || slowValue === null || slowValue === undefined
      ? null
      : value - slowValue;
  });
  const firstDefined = macd.findIndex((value) => value !== null);
  const signal: (number | null)[] = macd.map(() => null);
  if (firstDefined >= 0) {
    const defined = macd.slice(firstDefined).map((value) => value ?? 0);
    exponentialMovingAverage(defined, signalPeriod).forEach((value, offset) => {
      signal[firstDefined + offset] = value;
    });
  }
  const histogram = macd.map((value, index) => {
    const signalValue = signal[index];
    return value === null || signalValue === null || signalValue === undefined
      ? null
      : value - signalValue;
  });
  return { macd, signal, histogram };
}

// Average true range with Wilder's smoothing.
export function averageTrueRange(bars: readonly OhlcPoint[], period = 14): IndicatorSeries {
  const result: (number | null)[] = bars.map(() => null);
  const trueRanges = bars.map((bar, index) => {
    const previousClose = bars[index - 1]?.close;
    return previousClose === undefined
      ? bar.high - bar.low
      : Math.max(
          bar.high - bar.low,
          Math.abs(bar.high - previousClose),
          Math.abs(bar.low - previousClose),
        );
  });
  if (trueRanges.length < period) {
    return result;
  }
  let atr = trueRanges.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = atr;
  for (let index = period; index < trueRanges.length; index += 1) {
    atr = (atr * (period - 1) + (trueRanges[index] ?? 0)) / period;
    result[index] = atr;
  }
  return result;
}

export interface StochasticResult {
  readonly k: IndicatorSeries;
  readonly d: IndicatorSeries;
}

export function stochasticOscillator(
  bars: readonly OhlcPoint[],
  period = 14,
  smoothing = 3,
): StochasticResult {
  const k = bars.map((bar, index) => {
    if (index < period - 1) {
      return null;
    }
    const window = bars.slice(index - period + 1, index + 1);
    const highest = Math.max(...window.map((item) => item.high));
    const lowest = Math.min(...window.map((item) => item.low));
    return highest === lowest ? 50 : ((bar.close - lowest) / (highest - lowest)) * 100;
  });
  const d: (number | null)[] = k.map((_, index) => {
    const window = k.slice(Math.max(0, index - smoothing + 1), index + 1);
    return window.length === smoothing && window.every((value) => value !== null)
      ? window.reduce<number>((sum, value) => sum + (value ?? 0), 0) / smoothing
      : null;
  });
  return { k, d };
}
