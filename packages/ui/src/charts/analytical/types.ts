import type { EChartsOption } from 'echarts';

// Raw ECharts options for the 'custom' preset.
export type AnalyticalChartOptions = EChartsOption;

interface NamedSeries {
  readonly name: string;
  readonly values: readonly number[];
}

// Several series on one date axis, already normalised by the caller (UI spec 7.11).
export interface ComparisonCurvesData {
  readonly dates: readonly string[];
  readonly series: readonly NamedSeries[];
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

// Individual period returns in percent; bins and the normal curve are derived (UI spec 8.1).
export interface ReturnsDistributionData {
  readonly returns: readonly number[];
  readonly binCount?: number;
}

export interface TreemapNode {
  readonly name: string;
  // Size of the tile, e.g. market value in base currency.
  readonly value: number;
  // Return in percent; colours the tile from loss through neutral to gain.
  readonly performance?: number;
  readonly children?: readonly TreemapNode[];
}

export interface TreemapData {
  readonly items: readonly TreemapNode[];
}

// Allocation drift: each series is one bucket's weight or value at every date.
export interface StackedAreaData {
  readonly dates: readonly string[];
  readonly series: readonly NamedSeries[];
  readonly percent?: boolean;
}

export interface CorrelationMatrixData {
  readonly labels: readonly string[];
  // Square matrix of coefficients between -1 and 1, rows and columns in label order.
  readonly matrix: readonly (readonly number[])[];
}

// A measure over a moving window; null where the window is not yet full.
export interface RollingMetricData {
  readonly dates: readonly string[];
  readonly series: readonly {
    readonly name: string;
    readonly values: readonly (number | null)[];
  }[];
  readonly threshold?: number;
  readonly unit?: string;
}

export interface BarChartData {
  readonly categories: readonly string[];
  readonly series: readonly NamedSeries[];
  // Colour each bar by sign (gain or loss) instead of by series.
  readonly signed?: boolean;
  readonly horizontal?: boolean;
  readonly unit?: string;
}

// Contribution to a total: each step adds or subtracts, the total closes the chart.
export interface WaterfallData {
  readonly steps: readonly { readonly name: string; readonly value: number }[];
  readonly totalLabel?: string;
  readonly unit?: string;
}

export interface ScatterData {
  readonly points: readonly {
    readonly name: string;
    readonly x: number;
    readonly y: number;
    // Relative bubble size, e.g. weight in the portfolio.
    readonly size?: number;
  }[];
  readonly xLabel: string;
  readonly yLabel: string;
}

interface ChartFrame {
  readonly height?: number | string;
  readonly className?: string;
}

export type AnalyticalChartProps = ChartFrame &
  (
    | { readonly preset?: 'custom'; readonly options: AnalyticalChartOptions }
    | { readonly preset: 'equity-curve'; readonly data: EquityCurveData }
    | { readonly preset: 'comparison-curves'; readonly data: ComparisonCurvesData }
    | { readonly preset: 'underwater-drawdown'; readonly data: DrawdownData }
    | { readonly preset: 'monthly-returns-heatmap'; readonly data: HeatmapData }
    | { readonly preset: 'allocation-donut'; readonly data: DonutData }
    | { readonly preset: 'returns-distribution'; readonly data: ReturnsDistributionData }
    | { readonly preset: 'allocation-treemap'; readonly data: TreemapData }
    | { readonly preset: 'stacked-area'; readonly data: StackedAreaData }
    | { readonly preset: 'correlation-matrix'; readonly data: CorrelationMatrixData }
    | { readonly preset: 'rolling-metric'; readonly data: RollingMetricData }
    | { readonly preset: 'bar'; readonly data: BarChartData }
    | { readonly preset: 'waterfall'; readonly data: WaterfallData }
    | { readonly preset: 'scatter'; readonly data: ScatterData }
  );

export type AnalyticalChartPreset = NonNullable<AnalyticalChartProps['preset']>;
