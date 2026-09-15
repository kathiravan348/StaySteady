import type { PriceChartMarker } from '../price/types';

// UI spec 7.4 — the research chart. Domain-free: callers pass numbers and times only.

// A calendar date ("YYYY-MM-DD") for daily and longer bars, or Unix seconds for intraday bars.
export type ChartTime = string | number;

export type TradingSeriesStyle = 'candlestick' | 'hollow' | 'bar' | 'line' | 'area';
export type TradingPriceScale = 'linear' | 'log' | 'percent';
export type DrawingTool = 'trend' | 'horizontal' | 'rectangle' | 'text';

export interface TradingBar {
  readonly time: ChartTime;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  // Extended-hours bars are drawn muted so they stay distinct from the regular session.
  readonly isExtendedHours?: boolean;
}

// A gap keeps a slot on the time axis with no bar, e.g. a market holiday (UI spec 7.4).
export interface TradingGap {
  readonly time: ChartTime;
  readonly isGap: true;
}

export type TradingChartBar = TradingBar | TradingGap;

export interface TradingPoint {
  readonly time: ChartTime;
  readonly value: number;
  readonly tone?: 'up' | 'down' | 'neutral';
}

// A line or histogram. colorIndex picks from the theme's series palette.
export interface TradingSeries {
  readonly id: string;
  readonly label: string;
  readonly kind: 'line' | 'histogram';
  readonly colorIndex: number;
  readonly points: readonly TradingPoint[];
  readonly isDashed?: boolean;
  // Legend formatting: 'price' uses formatPrice, 'compact' suits volumes. Default 'number'.
  readonly valueFormat?: 'price' | 'number' | 'compact';
}

// A pane stacked below the price pane, sharing its time axis and crosshair.
export interface TradingPane {
  readonly id: string;
  readonly label: string;
  readonly series: readonly TradingSeries[];
  // Horizontal guide values, e.g. 30 and 70 for RSI.
  readonly guides?: readonly number[];
  readonly heightRatio?: number;
}

export interface ChartAnchor {
  readonly time: ChartTime;
  readonly price: number;
}

export type TradingDrawing =
  | {
      readonly id: string;
      readonly kind: 'trend';
      readonly from: ChartAnchor;
      readonly to: ChartAnchor;
    }
  | {
      readonly id: string;
      readonly kind: 'rectangle';
      readonly from: ChartAnchor;
      readonly to: ChartAnchor;
    }
  | { readonly id: string; readonly kind: 'horizontal'; readonly price: number }
  | { readonly id: string; readonly kind: 'text'; readonly at: ChartAnchor; readonly text: string };

// What a drawing tool produced; the caller assigns the id (and the text for text notes).
export type DrawingDraft =
  | { readonly kind: 'trend' | 'rectangle'; readonly from: ChartAnchor; readonly to: ChartAnchor }
  | { readonly kind: 'horizontal'; readonly price: number }
  | { readonly kind: 'text'; readonly at: ChartAnchor };

export interface LegendValue {
  readonly label: string;
  readonly value: string;
  readonly colorIndex?: number;
}

export interface TradingChartProps {
  readonly bars: readonly TradingChartBar[];
  readonly style?: TradingSeriesStyle;
  readonly priceScale?: TradingPriceScale;
  readonly mainLabel: string;
  // Lines drawn on the price pane (moving averages, bands, a comparison series).
  readonly overlays?: readonly TradingSeries[];
  readonly panes?: readonly TradingPane[];
  // Marker times must match bar times.
  readonly markers?: readonly PriceChartMarker[];
  readonly drawings?: readonly TradingDrawing[];
  readonly activeTool?: DrawingTool | null;
  readonly onDrawingDraft?: (draft: DrawingDraft) => void;
  // Formats prices for the legend with the instrument's precision and currency.
  readonly formatPrice?: (value: number) => string;
  readonly formatTime?: (time: ChartTime) => string;
  readonly height?: number;
  // Bars shown by default and after "Reset view"; null fits all bars.
  readonly visibleBarCount?: number | null;
  readonly ariaLabel: string;
  readonly className?: string;
}
