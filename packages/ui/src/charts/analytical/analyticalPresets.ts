import type { EChartsOption } from 'echarts';
import type { ChartThemeColors } from '../theme/chartThemeTokens';

export function createEquityCurveOption(
  dates: readonly string[],
  equity: readonly number[],
  benchmark?: readonly number[],
  theme?: ChartThemeColors,
): EChartsOption {
  const isDark = theme?.isDark ?? true;
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme?.tooltipBackground ?? '#1e293b',
      textStyle: { color: theme?.textColor ?? '#f8fafc' },
    },
    legend: { textStyle: { color: theme?.textColor ?? '#94a3b8' }, top: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: [...dates],
      axisLine: { lineStyle: { color: theme?.borderColor ?? '#334155' } },
      axisLabel: { color: theme?.textColor ?? '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: theme?.borderColor ?? '#334155' } },
      splitLine: { lineStyle: { color: theme?.gridColor ?? '#1e293b' } },
      axisLabel: { color: theme?.textColor ?? '#94a3b8' },
    },
    series: [
      {
        name: 'Strategy Equity',
        type: 'line',
        data: [...equity],
        smooth: true,
        itemStyle: { color: theme?.primaryColor ?? '#3b82f6' },
        lineStyle: { width: 2 },
      },
      ...(benchmark
        ? [
            {
              name: 'Benchmark',
              type: 'line' as const,
              data: [...benchmark],
              smooth: true,
              itemStyle: { color: isDark ? '#94a3b8' : '#64748b' },
              lineStyle: { width: 1.5, type: 'dashed' as const },
            },
          ]
        : []),
    ],
  };
}

// Two to four normalised series on one axis, each in a palette colour (UI spec 7.11).
export function createComparisonCurvesOption(
  dates: readonly string[],
  series: readonly { readonly name: string; readonly values: readonly number[] }[],
  baseline: number | undefined,
  theme?: ChartThemeColors,
): EChartsOption {
  const palette = theme?.palette ?? ['#60a5fa', '#f59e0b', '#a78bfa', '#34d399'];
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme?.tooltipBackground ?? '#1e293b',
      textStyle: { color: theme?.textColor ?? '#f8fafc' },
    },
    legend: { textStyle: { color: theme?.textColor ?? '#94a3b8' }, top: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: [...dates],
      axisLine: { lineStyle: { color: theme?.borderColor ?? '#334155' } },
      axisLabel: { color: theme?.textColor ?? '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: theme?.borderColor ?? '#334155' } },
      splitLine: { lineStyle: { color: theme?.gridColor ?? '#1e293b' } },
      axisLabel: { color: theme?.textColor ?? '#94a3b8' },
    },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'line' as const,
      data: [...item.values],
      smooth: true,
      showSymbol: false,
      itemStyle: { color: palette[index % palette.length] ?? '#60a5fa' },
      lineStyle: { width: 2 },
      ...(index === 0 && baseline !== undefined
        ? {
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: { color: theme?.borderColor ?? '#334155', type: 'dashed' as const },
              data: [{ yAxis: baseline }],
            },
          }
        : {}),
    })),
  };
}

export function createDrawdownOption(
  dates: readonly string[],
  drawdowns: readonly number[],
  theme?: ChartThemeColors,
): EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme?.tooltipBackground ?? '#1e293b',
      textStyle: { color: theme?.textColor ?? '#f8fafc' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: [...dates],
      axisLine: { lineStyle: { color: theme?.borderColor ?? '#334155' } },
      axisLabel: { color: theme?.textColor ?? '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      max: 0,
      axisLine: { lineStyle: { color: theme?.borderColor ?? '#334155' } },
      splitLine: { lineStyle: { color: theme?.gridColor ?? '#1e293b' } },
      axisLabel: { color: theme?.textColor ?? '#94a3b8', formatter: '{value}%' },
    },
    series: [
      {
        name: 'Drawdown',
        type: 'line',
        data: [...drawdowns],
        areaStyle: { color: 'rgba(239, 68, 68, 0.25)' },
        itemStyle: { color: theme?.downColor ?? '#ef4444' },
        lineStyle: { width: 1.5 },
      },
    ],
  };
}

export function createDonutOption(
  items: readonly { readonly name: string; readonly value: number }[],
  theme?: ChartThemeColors,
): EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: theme?.tooltipBackground ?? '#1e293b',
      textStyle: { color: theme?.textColor ?? '#f8fafc' },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: theme?.textColor ?? '#94a3b8' },
    },
    series: [
      {
        name: 'Allocation',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: theme?.background ?? '#0f172a',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: [...items],
      },
    ],
  };
}

export function createMonthlyHeatmapOption(
  years: readonly string[],
  months: readonly string[],
  data: readonly [number, number, number][],
  theme?: ChartThemeColors,
): EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top' },
    grid: { height: '60%', top: '10%' },
    xAxis: { type: 'category', data: [...months], splitArea: { show: true } },
    yAxis: { type: 'category', data: [...years], splitArea: { show: true } },
    visualMap: {
      min: -10,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '10%',
      inRange: { color: [theme?.downColor ?? '#ef4444', '#1e293b', theme?.upColor ?? '#22c55e'] },
    },
    series: [
      {
        name: 'Monthly Return (%)',
        type: 'heatmap',
        data: [...data],
        label: { show: true, color: '#ffffff' },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      },
    ],
  };
}
