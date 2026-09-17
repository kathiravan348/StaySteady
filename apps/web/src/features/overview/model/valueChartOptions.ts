// Portfolio value line chart options (UI spec 8.1). Numbers convert to floats only here, at the edge.

import type { AnalyticalChartOptions, ChartThemeColors } from '@staysteady/ui';

import { formatMoney } from '../../../shared/format';
import { createMoney } from '../../../shared/money';
import type { ValueSeries } from './valueHistory';

type ChartOptions = AnalyticalChartOptions;

export function buildValueChartOptions(series: ValueSeries, theme: ChartThemeColors): ChartOptions {
  const compact = (value: number): string =>
    formatMoney(createMoney(value, series.currency), { compact: true });

  return {
    // UI spec 4 — charts do not animate when data updates.
    animation: false,
    backgroundColor: 'transparent',
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.tooltipBackground,
      borderColor: theme.borderColor,
      textStyle: { color: theme.textColor },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [...series.dates],
      axisLine: { lineStyle: { color: theme.borderColor } },
      axisLabel: { color: theme.textColor },
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: { color: theme.textColor, formatter: compact },
    },
    series: [
      {
        name: `Portfolio value (${series.currency})`,
        type: 'line',
        data: [...series.values],
        showSymbol: false,
        lineStyle: { width: 2, color: theme.primaryColor },
        itemStyle: { color: theme.primaryColor },
        areaStyle: { color: theme.primaryColor, opacity: 0.12 },
      },
    ],
  };
}
