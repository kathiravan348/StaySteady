import type { EChartsOption } from 'echarts';

import type { ChartThemeColors } from '../theme/chartThemeTokens';
import {
  createComparisonCurvesOption,
  createDonutOption,
  createDrawdownOption,
  createEquityCurveOption,
  createMonthlyHeatmapOption,
} from './analyticalPresets';
import {
  createCorrelationMatrixOption,
  createRollingMetricOption,
  createStackedAreaOption,
  createTreemapOption,
} from './compositionPresets';
import {
  createBarOption,
  createReturnsDistributionOption,
  createScatterOption,
  createWaterfallOption,
} from './distributionPresets';
import type { AnalyticalChartProps } from './types';

// Resolves a preset and its data to ECharts options; the props union keeps data matched to preset.
export function buildAnalyticalOption(
  props: AnalyticalChartProps,
  theme: ChartThemeColors,
): EChartsOption {
  if (props.preset === undefined || props.preset === 'custom') return props.options;
  switch (props.preset) {
    case 'equity-curve':
      return createEquityCurveOption(
        props.data.dates,
        props.data.equity,
        props.data.benchmark,
        theme,
      );
    case 'comparison-curves':
      return createComparisonCurvesOption(
        props.data.dates,
        props.data.series,
        props.data.baseline,
        theme,
      );
    case 'underwater-drawdown':
      return createDrawdownOption(props.data.dates, props.data.drawdowns, theme);
    case 'monthly-returns-heatmap':
      return createMonthlyHeatmapOption(
        props.data.years,
        props.data.months,
        props.data.data,
        theme,
      );
    case 'allocation-donut':
      return createDonutOption(props.data.items, theme);
    case 'returns-distribution':
      return createReturnsDistributionOption(props.data, theme);
    case 'allocation-treemap':
      return createTreemapOption(props.data, theme);
    case 'stacked-area':
      return createStackedAreaOption(props.data, theme);
    case 'correlation-matrix':
      return createCorrelationMatrixOption(props.data, theme);
    case 'rolling-metric':
      return createRollingMetricOption(props.data, theme);
    case 'bar':
      return createBarOption(props.data, theme);
    case 'waterfall':
      return createWaterfallOption(props.data, theme);
    case 'scatter':
      return createScatterOption(props.data, theme);
  }
}
