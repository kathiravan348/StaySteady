// Overlays and indicator panes for the selected indicators (UI spec 7.4 indicator set). Pure.

import type { TradingPane, TradingPoint, TradingSeries } from '@staysteady/ui';

import type { IndicatorSeries } from '../../../../shared/indicators/indicators';
import {
  averageTrueRange,
  bollingerBands,
  exponentialMovingAverage,
  movingAverageConvergenceDivergence,
  relativeStrengthIndex,
  simpleMovingAverage,
  stochasticOscillator,
} from '../../../../shared/indicators/indicators';
import type { ChartPoint } from './chartData';
import type { IndicatorId } from './workspaceLayout';

export interface CompareSeries {
  readonly label: string;
  readonly points: readonly { readonly time: string | number; readonly close: number }[];
}

export interface Studies {
  readonly overlays: readonly TradingSeries[];
  readonly panes: readonly TradingPane[];
}

function toPoints(points: readonly ChartPoint[], values: IndicatorSeries): TradingPoint[] {
  return points.flatMap((point, index) => {
    const value = values[index];
    return value === null || value === undefined ? [] : [{ time: point.time, value }];
  });
}

function line(
  id: string,
  label: string,
  colorIndex: number,
  points: readonly TradingPoint[],
  options: Pick<TradingSeries, 'valueFormat'> & { readonly isDashed?: boolean } = {
    valueFormat: 'price',
  },
): TradingSeries {
  return { id, label, kind: 'line', colorIndex, points, ...options };
}

function volumePane(
  points: readonly ChartPoint[],
  selected: ReadonlySet<IndicatorId>,
): TradingPane {
  const volumes = points.map((point) => point.volume);
  const series: TradingSeries[] = [];
  if (selected.has('volume')) {
    series.push({
      id: 'volume',
      label: 'Vol',
      kind: 'histogram',
      colorIndex: 5,
      valueFormat: 'compact',
      points: points.map((point) => ({
        time: point.time,
        value: point.volume,
        tone: point.close >= point.open ? 'up' : 'down',
      })),
    });
  }
  if (selected.has('volumeMa')) {
    series.push(
      line('volumeMa', 'Vol avg 20', 1, toPoints(points, simpleMovingAverage(volumes, 20)), {
        valueFormat: 'compact',
      }),
    );
  }
  return { id: 'volume', label: 'Volume', heightRatio: 0.22, series };
}

export function buildStudies(
  points: readonly ChartPoint[],
  indicators: readonly IndicatorId[],
  compare: CompareSeries | null,
): Studies {
  const selected = new Set(indicators);
  const closes = points.map((point) => point.close);
  const number = { valueFormat: 'number' } as const;
  const overlays: TradingSeries[] = [];

  if (selected.has('sma20')) {
    overlays.push(line('sma20', 'SMA 20', 0, toPoints(points, simpleMovingAverage(closes, 20))));
  }
  if (selected.has('sma50')) {
    overlays.push(line('sma50', 'SMA 50', 1, toPoints(points, simpleMovingAverage(closes, 50))));
  }
  if (selected.has('ema20')) {
    overlays.push(
      line('ema20', 'EMA 20', 2, toPoints(points, exponentialMovingAverage(closes, 20))),
    );
  }
  if (selected.has('bollinger')) {
    const bands = bollingerBands(closes);
    const dashed = { valueFormat: 'price', isDashed: true } as const;
    overlays.push(line('bbUpper', 'BB upper', 3, toPoints(points, bands.upper), dashed));
    overlays.push(line('bbLower', 'BB lower', 3, toPoints(points, bands.lower), dashed));
  }
  if (compare !== null) {
    const times = new Set(points.map((point) => point.time));
    overlays.push(
      line(
        'compare',
        compare.label,
        4,
        compare.points
          .filter((point) => times.has(point.time))
          .map((point) => ({ time: point.time, value: point.close })),
        number,
      ),
    );
  }

  const panes: TradingPane[] = [];
  if (selected.has('volume') || selected.has('volumeMa')) {
    panes.push(volumePane(points, selected));
  }
  if (selected.has('rsi')) {
    panes.push({
      id: 'rsi',
      label: 'RSI 14',
      guides: [30, 70],
      heightRatio: 0.22,
      series: [line('rsi', 'RSI', 2, toPoints(points, relativeStrengthIndex(closes)), number)],
    });
  }
  if (selected.has('macd')) {
    const macd = movingAverageConvergenceDivergence(closes);
    panes.push({
      id: 'macd',
      label: 'MACD',
      heightRatio: 0.22,
      series: [
        {
          id: 'macdHistogram',
          label: 'Hist',
          kind: 'histogram',
          colorIndex: 5,
          valueFormat: 'number',
          points: toPoints(points, macd.histogram).map((point) => ({
            ...point,
            tone: point.value >= 0 ? 'up' : 'down',
          })),
        },
        line('macd', 'MACD', 0, toPoints(points, macd.macd), number),
        line('macdSignal', 'Signal', 1, toPoints(points, macd.signal), number),
      ],
    });
  }
  if (selected.has('atr')) {
    panes.push({
      id: 'atr',
      label: 'ATR 14',
      heightRatio: 0.2,
      series: [line('atr', 'ATR', 3, toPoints(points, averageTrueRange(points)))],
    });
  }
  if (selected.has('stochastic')) {
    const stochastic = stochasticOscillator(points);
    panes.push({
      id: 'stochastic',
      label: 'Stochastic',
      guides: [20, 80],
      heightRatio: 0.22,
      series: [
        line('stochK', '%K', 0, toPoints(points, stochastic.k), number),
        line('stochD', '%D', 1, toPoints(points, stochastic.d), { ...number, isDashed: true }),
      ],
    });
  }
  return { overlays, panes };
}
