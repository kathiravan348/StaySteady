import type { BarSeriesOption, EChartsOption } from 'echarts';

import { paletteColor } from '../shared/chartColors';
import type { ChartThemeColors } from '../theme/chartThemeTokens';
import { categoryAxis, themedLegend, themedTooltip, valueAxis } from './presetParts';
import type { BarChartData, ReturnsDistributionData, ScatterData, WaterfallData } from './types';

const GRID = { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true } as const;

const formatSigned = (value: number, unit: string): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}${unit}`;

interface Histogram {
  readonly labels: string[];
  readonly counts: number[];
  readonly normal: number[];
}

// Equal-width bins across the observed range, with the normal curve of the same mean and spread
// scaled to expected counts per bin so the two read on one axis.
export function buildHistogram(returns: readonly number[], binCount?: number): Histogram {
  const n = returns.length;
  if (n === 0) return { labels: [], counts: [], normal: [] };
  const min = Math.min(...returns);
  const max = Math.max(...returns);
  const bins = Math.min(40, Math.max(5, binCount ?? Math.ceil(Math.sqrt(n))));
  const width = max === min ? 1 : (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const value of returns) {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const mean = returns.reduce((sum, value) => sum + value, 0) / n;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const labels: string[] = [];
  const normal: number[] = [];
  for (let index = 0; index < bins; index += 1) {
    const centre = min + width * (index + 0.5);
    labels.push(`${(min + width * index).toFixed(1)}%`);
    const density =
      sd === 0
        ? 0
        : Math.exp(-((centre - mean) ** 2) / (2 * variance)) / (sd * Math.sqrt(2 * Math.PI));
    normal.push(Number((density * width * n).toFixed(2)));
  }
  return { labels, counts, normal };
}

export function createReturnsDistributionOption(
  data: ReturnsDistributionData,
  theme: ChartThemeColors,
): EChartsOption {
  const histogram = buildHistogram(data.returns, data.binCount);
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'axis'),
    legend: themedLegend(theme),
    grid: GRID,
    xAxis: categoryAxis(histogram.labels, theme),
    yAxis: { ...valueAxis(theme), scale: false, minInterval: 1 },
    series: [
      {
        name: 'Periods',
        type: 'bar',
        barCategoryGap: '8%',
        data: histogram.counts,
        itemStyle: { color: theme.primaryColor },
      },
      {
        name: 'Normal curve',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: histogram.normal,
        itemStyle: { color: paletteColor(1, theme) },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  };
}

export function createBarOption(data: BarChartData, theme: ChartThemeColors): EChartsOption {
  const categories = categoryAxis(data.categories, theme);
  const values = { ...valueAxis(theme, data.unit), scale: false };
  const series: BarSeriesOption[] = data.series.map((item, index) => ({
    name: item.name,
    type: 'bar',
    data: item.values.map((value) => ({
      value,
      itemStyle: {
        color:
          data.signed === true
            ? value < 0
              ? theme.downColor
              : theme.upColor
            : paletteColor(index, theme),
      },
    })),
  }));
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'axis'),
    ...(data.series.length > 1 ? { legend: themedLegend(theme) } : {}),
    grid: GRID,
    xAxis: data.horizontal === true ? values : categories,
    yAxis: data.horizontal === true ? categories : values,
    series,
  };
}

// Invisible base bars lift each step to the running total; the visible bar is the step itself.
export function createWaterfallOption(data: WaterfallData, theme: ChartThemeColors): EChartsOption {
  const unit = data.unit ?? '';
  const names: string[] = [];
  const bases: number[] = [];
  const steps: NonNullable<BarSeriesOption['data']> = [];
  let running = 0;
  for (const step of data.steps) {
    const next = running + step.value;
    names.push(step.name);
    bases.push(Math.min(running, next));
    steps.push({
      value: Math.abs(step.value),
      itemStyle: { color: step.value < 0 ? theme.downColor : theme.upColor },
      label: { show: true, position: 'top', formatter: formatSigned(step.value, unit) },
    });
    running = next;
  }
  names.push(data.totalLabel ?? 'Total');
  bases.push(Math.min(0, running));
  steps.push({
    value: Math.abs(running),
    itemStyle: { color: theme.primaryColor },
    label: { show: true, position: 'top', formatter: formatSigned(running, unit) },
  });
  return {
    backgroundColor: 'transparent',
    grid: GRID,
    xAxis: categoryAxis(names, theme),
    yAxis: { ...valueAxis(theme, unit), scale: false },
    series: [
      {
        name: 'Base',
        type: 'bar',
        stack: 'waterfall',
        stackStrategy: 'all',
        silent: true,
        itemStyle: { color: 'transparent' },
        data: bases,
      },
      {
        name: 'Contribution',
        type: 'bar',
        stack: 'waterfall',
        stackStrategy: 'all',
        label: { color: theme.textColor },
        data: steps,
      },
    ],
  };
}

export function createScatterOption(data: ScatterData, theme: ChartThemeColors): EChartsOption {
  const largest = Math.max(0, ...data.points.map((point) => point.size ?? 0));
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'item'),
    grid: { ...GRID, top: '10%', bottom: '8%' },
    xAxis: {
      ...valueAxis(theme),
      name: data.xLabel,
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: theme.textColor },
    },
    yAxis: {
      ...valueAxis(theme),
      name: data.yLabel,
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: theme.textColor },
    },
    series: [
      {
        type: 'scatter',
        data: data.points.map((point, index) => ({
          name: point.name,
          value: [point.x, point.y],
          symbolSize:
            largest > 0 && point.size !== undefined ? 8 + (24 * point.size) / largest : 12,
          itemStyle: { color: paletteColor(index, theme) },
          label: { show: true, position: 'right', formatter: point.name, color: theme.textColor },
        })),
      },
    ],
  };
}
