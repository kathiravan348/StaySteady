import type { ChartTime, LegendValue, TradingChartProps, TradingSeries } from './types';

// Legend values for the latest bar, shown when the crosshair is not over the chart (UI spec 8.3).

export interface LegendState {
  readonly time: ChartTime | null;
  readonly values: readonly LegendValue[];
}

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function formatStudyValue(
  series: TradingSeries,
  value: number,
  formatPrice: (value: number) => string,
): string {
  if (series.valueFormat === 'price') {
    return formatPrice(value);
  }
  return series.valueFormat === 'compact' ? compactFormatter.format(value) : value.toFixed(2);
}

export function ohlcLegend(
  bar: {
    readonly open: number;
    readonly high: number;
    readonly low: number;
    readonly close: number;
  },
  formatPrice: (value: number) => string,
): LegendValue[] {
  return [
    { label: 'O', value: formatPrice(bar.open) },
    { label: 'H', value: formatPrice(bar.high) },
    { label: 'L', value: formatPrice(bar.low) },
    { label: 'C', value: formatPrice(bar.close) },
  ];
}

export function latestLegend(
  props: TradingChartProps,
  formatPrice: (value: number) => string,
): LegendState {
  const lastBar = [...props.bars].reverse().find((bar) => !('isGap' in bar));
  if (lastBar === undefined || 'isGap' in lastBar) {
    return { time: null, values: [] };
  }
  const studies = [
    ...(props.overlays ?? []),
    ...(props.panes ?? []).flatMap((pane) => pane.series),
  ];
  const studyValues = studies.flatMap((series): LegendValue[] => {
    const point = series.points[series.points.length - 1];
    return point === undefined
      ? []
      : [
          {
            label: series.label,
            value: formatStudyValue(series, point.value, formatPrice),
            colorIndex: series.colorIndex,
          },
        ];
  });
  return { time: lastBar.time, values: [...ohlcLegend(lastBar, formatPrice), ...studyValues] };
}
