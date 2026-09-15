import type { EChartsOption } from 'echarts';

export type AnalyticalChartPreset =
  | 'custom'
  | 'equity-curve'
  | 'underwater-drawdown'
  | 'monthly-returns-heatmap'
  | 'returns-distribution'
  | 'allocation-donut'
  | 'correlation-matrix';

export interface EquityCurveData {
  readonly dates: readonly string[];
  readonly equity: readonly number[];
  readonly benchmark?: readonly number[];
}

export interface DrawdownData {
  readonly dates: readonly string[];
  readonly drawdowns: readonly number[];
}

export interface DonutData {
  readonly items: readonly { readonly name: string; readonly value: number }[];
}

export interface HeatmapData {
  readonly years: readonly string[];
  readonly months: readonly string[];
  readonly data: readonly [number, number, number][];
}

export type AnalyticalChartData =
  EquityCurveData | DrawdownData | DonutData | HeatmapData | Record<string, unknown>;

export interface AnalyticalChartProps {
  readonly preset?: AnalyticalChartPreset;
  readonly options?: EChartsOption;
  readonly data?: AnalyticalChartData;
  readonly height?: number | string;
  readonly className?: string;
}
