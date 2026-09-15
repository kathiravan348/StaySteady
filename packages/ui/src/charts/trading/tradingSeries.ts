import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type WhitespaceData,
} from 'lightweight-charts';

import { paletteColor, volumeToneColor } from '../shared/chartColors';
import type { ChartThemeColors } from '../theme/chartThemeTokens';
import { toLibraryTime } from './chartTime';
import type { TradingChartBar, TradingGap, TradingSeries, TradingSeriesStyle } from './types';

// Series builders for TradingChart. Each adds a series to the chart and sets its data.

export type MainSeriesApi = ISeriesApi<'Candlestick' | 'Bar' | 'Line' | 'Area'>;
export type StudySeriesApi = ISeriesApi<'Line'> | ISeriesApi<'Histogram'>;

export const isGap = (bar: TradingChartBar): bar is TradingGap => 'isGap' in bar;

function lineData(bars: readonly TradingChartBar[]): (LineData<Time> | WhitespaceData<Time>)[] {
  return bars.map((bar) => {
    const time = toLibraryTime(bar.time);
    return isGap(bar) ? { time } : { time, value: bar.close };
  });
}

function ohlcData(
  bars: readonly TradingChartBar[],
  mutedColor: string,
): (CandlestickData<Time> | WhitespaceData<Time>)[] {
  return bars.map((bar) => {
    const time = toLibraryTime(bar.time);
    if (isGap(bar)) {
      return { time };
    }
    const base = { time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
    return bar.isExtendedHours === true
      ? { ...base, color: mutedColor, borderColor: mutedColor, wickColor: mutedColor }
      : base;
  });
}

export function candleColors(
  style: TradingSeriesStyle,
  colors: ChartThemeColors,
): Record<string, string> {
  return {
    upColor: style === 'hollow' ? 'rgba(0, 0, 0, 0)' : colors.upColor,
    downColor: colors.downColor,
    borderUpColor: colors.upColor,
    borderDownColor: colors.downColor,
    wickUpColor: colors.upColor,
    wickDownColor: colors.downColor,
  };
}

export function addMainSeries(
  chart: IChartApi,
  bars: readonly TradingChartBar[],
  style: TradingSeriesStyle,
  colors: ChartThemeColors,
): MainSeriesApi {
  switch (style) {
    case 'line': {
      const series = chart.addSeries(LineSeries, { color: colors.primaryColor, lineWidth: 2 });
      series.setData(lineData(bars));
      return series;
    }
    case 'area': {
      const series = chart.addSeries(AreaSeries, {
        lineColor: colors.primaryColor,
        topColor: 'rgba(59, 130, 246, 0.35)',
        bottomColor: 'rgba(59, 130, 246, 0)',
        lineWidth: 2,
      });
      series.setData(lineData(bars));
      return series;
    }
    case 'bar': {
      const series = chart.addSeries(BarSeries, {
        upColor: colors.upColor,
        downColor: colors.downColor,
      });
      series.setData(ohlcData(bars, colors.mutedColor));
      return series;
    }
    case 'candlestick':
    case 'hollow': {
      const series = chart.addSeries(CandlestickSeries, candleColors(style, colors));
      series.setData(ohlcData(bars, colors.mutedColor));
      return series;
    }
  }
}

export function addStudySeries(
  chart: IChartApi,
  definition: TradingSeries,
  colors: ChartThemeColors,
  paneIndex: number,
): StudySeriesApi {
  const color = paletteColor(definition.colorIndex, colors);
  const common = { priceLineVisible: false, lastValueVisible: false };
  if (definition.kind === 'histogram') {
    const series = chart.addSeries(HistogramSeries, { ...common, color }, paneIndex);
    series.setData(
      definition.points.map((point) => {
        const time = toLibraryTime(point.time);
        return point.tone === undefined
          ? { time, value: point.value }
          : { time, value: point.value, color: volumeToneColor(point.tone, colors) };
      }),
    );
    return series;
  }
  const series = chart.addSeries(
    LineSeries,
    {
      ...common,
      color,
      lineWidth: 1,
      lineStyle: definition.isDashed === true ? LineStyle.Dashed : LineStyle.Solid,
      crosshairMarkerVisible: false,
    },
    paneIndex,
  );
  series.setData(
    definition.points.map((point) => ({ time: toLibraryTime(point.time), value: point.value })),
  );
  return series;
}
