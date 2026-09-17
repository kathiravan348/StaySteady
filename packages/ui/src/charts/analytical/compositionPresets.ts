import type { EChartsOption, TreemapSeriesOption } from 'echarts';

import { paletteColor } from '../shared/chartColors';
import type { ChartThemeColors } from '../theme/chartThemeTokens';
import {
  categoryAxis,
  divergingColor,
  themedLegend,
  themedTooltip,
  valueAxis,
} from './presetParts';
import type {
  CorrelationMatrixData,
  RollingMetricData,
  StackedAreaData,
  TreemapData,
  TreemapNode,
} from './types';

const GRID = { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true } as const;

type TreemapItem = NonNullable<TreemapSeriesOption['data']>[number];

function largestMove(nodes: readonly TreemapNode[]): number {
  return nodes.reduce(
    (limit, node) =>
      Math.max(limit, Math.abs(node.performance ?? 0), largestMove(node.children ?? [])),
    0,
  );
}

function toTreemapItem(node: TreemapNode, limit: number, theme: ChartThemeColors): TreemapItem {
  const performance = node.performance;
  return {
    name: node.name,
    value: node.value,
    ...(performance === undefined
      ? {}
      : { itemStyle: { color: divergingColor(performance, limit, theme) } }),
    ...(node.children === undefined
      ? {}
      : { children: node.children.map((child) => toTreemapItem(child, limit, theme)) }),
  };
}

// Nested allocation sized by value and coloured by performance (UI spec 8.1).
export function createTreemapOption(data: TreemapData, theme: ChartThemeColors): EChartsOption {
  const limit = largestMove(data.items);
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'item'),
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        label: { show: true, color: theme.strongTextColor },
        upperLabel: { show: true, height: 22, color: theme.textColor },
        itemStyle: { borderColor: theme.background, borderWidth: 2, gapWidth: 2 },
        levels: [{ itemStyle: { borderWidth: 0, gapWidth: 4 } }],
        data: data.items.map((item) => toTreemapItem(item, limit, theme)),
      },
    ],
  };
}

// Allocation drift over time: each bucket stacked on the ones before it.
export function createStackedAreaOption(
  data: StackedAreaData,
  theme: ChartThemeColors,
): EChartsOption {
  const unit = data.percent === true ? '%' : undefined;
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'axis'),
    legend: themedLegend(theme),
    grid: GRID,
    xAxis: { ...categoryAxis(data.dates, theme), boundaryGap: false },
    yAxis: {
      ...valueAxis(theme, unit),
      scale: false,
      ...(data.percent === true ? { max: 100 } : {}),
    },
    series: data.series.map((item, index) => ({
      name: item.name,
      type: 'line' as const,
      stack: 'allocation',
      smooth: true,
      showSymbol: false,
      areaStyle: { opacity: 0.55 },
      emphasis: { focus: 'series' as const },
      itemStyle: { color: paletteColor(index, theme) },
      lineStyle: { width: 1 },
      data: [...item.values],
    })),
  };
}

export function createCorrelationMatrixOption(
  data: CorrelationMatrixData,
  theme: ChartThemeColors,
): EChartsOption {
  const cells: [number, number, number][] = [];
  data.matrix.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      cells.push([columnIndex, rowIndex, Number(value.toFixed(2))]);
    });
  });
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'item'),
    grid: { left: '3%', right: '4%', top: '4%', bottom: '24%', containLabel: true },
    xAxis: { ...categoryAxis(data.labels, theme), splitArea: { show: true } },
    yAxis: { ...categoryAxis(data.labels, theme), inverse: true, splitArea: { show: true } },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: theme.textColor },
      inRange: { color: [theme.downColor, theme.gridColor, theme.upColor] },
    },
    series: [
      {
        name: 'Correlation',
        type: 'heatmap',
        data: cells,
        label: { show: data.labels.length <= 10, color: theme.strongTextColor },
        itemStyle: { borderColor: theme.background, borderWidth: 1 },
      },
    ],
  };
}

// One or more measures over a moving window, with an optional reference threshold.
export function createRollingMetricOption(
  data: RollingMetricData,
  theme: ChartThemeColors,
): EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: themedTooltip(theme, 'axis'),
    legend: themedLegend(theme),
    grid: GRID,
    xAxis: categoryAxis(data.dates, theme),
    yAxis: valueAxis(theme, data.unit),
    series: data.series.map((item, index) => ({
      name: item.name,
      type: 'line' as const,
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      itemStyle: { color: paletteColor(index, theme) },
      lineStyle: { width: 2 },
      data: item.values.map((value) => (value === null ? '-' : value)),
      ...(index === 0 && data.threshold !== undefined
        ? {
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: { color: theme.borderColor, type: 'dashed' as const },
              data: [{ yAxis: data.threshold }],
            },
          }
        : {}),
    })),
  };
}
