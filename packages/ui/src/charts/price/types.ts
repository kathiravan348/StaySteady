import type { Time } from 'lightweight-charts';

export type PriceSeriesType = 'candlestick' | 'line' | 'area' | 'bar';

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

export interface PriceChartProps {
  readonly data: readonly PriceBarData[];
  readonly volumeData?: readonly VolumeBarData[];
  readonly seriesType?: PriceSeriesType;
  readonly height?: number;
  readonly showVolume?: boolean;
  readonly className?: string;
}
