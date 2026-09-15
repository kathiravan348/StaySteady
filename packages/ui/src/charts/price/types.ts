import type { Time } from 'lightweight-charts';

export type PriceSeriesType = 'candlestick' | 'line' | 'area' | 'bar';

// Colour role for markers and level lines: 'up' and 'down' follow the gain/loss convention,
// 'neutral' uses the primary chart colour.
export type ChartTone = 'up' | 'down' | 'neutral';

export interface PriceBarData {
  readonly time: Time;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface VolumeBarData {
  readonly time: Time;
  readonly value: number;
  readonly color?: string;
}

export interface LinePointData {
  readonly time: Time;
  readonly value: number;
}

// A marker drawn on one bar, e.g. an entry or exit. `time` must match a bar in `data`.
export interface PriceChartMarker {
  readonly time: Time;
  readonly position: 'above' | 'below';
  readonly shape: 'arrowUp' | 'arrowDown' | 'circle';
  readonly tone: ChartTone;
  readonly text?: string;
}

// A horizontal price level across the chart, e.g. an exit level or average cost.
export interface PriceChartLevel {
  readonly id: string;
  readonly price: number;
  readonly title: string;
  readonly tone: ChartTone;
  readonly isDashed?: boolean;
}

export interface PriceChartProps {
  readonly data: readonly PriceBarData[];
  readonly volumeData?: readonly VolumeBarData[];
  readonly seriesType?: PriceSeriesType;
  readonly height?: number;
  readonly showVolume?: boolean;
  // Markers and levels are applied when the chart is created: memoise them in the caller.
  readonly markers?: readonly PriceChartMarker[];
  readonly priceLevels?: readonly PriceChartLevel[];
  // The canvas is not readable by screen readers: describe what the chart shows.
  readonly ariaLabel?: string;
  readonly className?: string;
}
