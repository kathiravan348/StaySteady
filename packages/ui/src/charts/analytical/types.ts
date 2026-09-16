import type { EChartsOption } from 'echarts';

export type AnalyticalChartPreset =
  | 'custom'
  | 'equity-curve'
  | 'comparison-curves'
  | 'underwater-drawdown'
  | 'monthly-returns-heatmap'
  | 'returns-distribution'
  | 'allocation-donut'
  | 'correlation-matrix';

// Several series on one date axis, already normalised by the caller (UI spec 7.11).
export interface ComparisonCurvesData {
  readonly dates: readonly string[];
  readonly series: readonly { readonly name: string; readonly values: readonly number[] }[];
  // Drawn as a reference line, e.g. 100 for series normalised to a common start.
  readonly baseline?: number;
}

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
  | EquityCurveData
  | ComparisonCurvesData
  | DrawdownData
  | DonutData
  | HeatmapData
  | Record<string, unknown>;

export interface AnalyticalChartProps {
  readonly preset?: AnalyticalChartPreset;
  readonly options?: EChartsOption;
  readonly data?: AnalyticalChartData;
  readonly height?: number | string;
  readonly className?: string;
}
