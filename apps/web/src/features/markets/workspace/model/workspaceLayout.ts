// Instrument workspace chart layout (UI spec 7.4 saved layouts). Pure: schema, defaults, labels.

import { z } from 'zod';

import type { InstrumentTypeDto } from '../../../../data/schemas';

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', 'D', 'W', 'M'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];
export type IntradayFrame = '1m' | '5m' | '15m' | '1h';

export const isIntraday = (timeframe: Timeframe): timeframe is IntradayFrame =>
  timeframe !== 'D' && timeframe !== 'W' && timeframe !== 'M';

export const TIMEFRAME_LABELS: Readonly<Record<Timeframe, string>> = {
  '1m': '1 min',
  '5m': '5 min',
  '15m': '15 min',
  '1h': '1 hour',
  D: 'Daily',
  W: 'Weekly',
  M: 'Monthly',
};

export const CHART_STYLES = ['candlestick', 'hollow', 'bar', 'line', 'area'] as const;
export type ChartStyle = (typeof CHART_STYLES)[number];

export const PRICE_SCALES = ['linear', 'log', 'percent'] as const;

export const RANGES = ['1M', '3M', '6M', '1Y', '3Y', 'All'] as const;
export type ChartRange = (typeof RANGES)[number];

export const INDICATORS = [
  'sma20',
  'sma50',
  'ema20',
  'bollinger',
  'volume',
  'volumeMa',
  'rsi',
  'macd',
  'atr',
  'stochastic',
] as const;
export type IndicatorId = (typeof INDICATORS)[number];

export const INDICATOR_LABELS: Readonly<Record<IndicatorId, string>> = {
  sma20: 'Simple moving average 20',
  sma50: 'Simple moving average 50',
  ema20: 'Exponential moving average 20',
  bollinger: 'Bollinger bands (20, 2)',
  volume: 'Volume',
  volumeMa: 'Volume average 20',
  rsi: 'Relative strength index 14',
  macd: 'MACD (12, 26, 9)',
  atr: 'Average true range 14',
  stochastic: 'Stochastic oscillator (14, 3)',
};

const TimeSchema = z.union([z.string().min(1), z.number()]);
const AnchorSchema = z.object({ time: TimeSchema, price: z.number() });

export const DrawingSchema = z.discriminatedUnion('kind', [
  z.object({ id: z.string(), kind: z.literal('trend'), from: AnchorSchema, to: AnchorSchema }),
  z.object({ id: z.string(), kind: z.literal('rectangle'), from: AnchorSchema, to: AnchorSchema }),
  z.object({ id: z.string(), kind: z.literal('horizontal'), price: z.number() }),
  z.object({
    id: z.string(),
    kind: z.literal('text'),
    at: AnchorSchema,
    text: z.string().min(1).max(80),
  }),
]);

// Drawings are kept per timeframe because intraday and daily bars use different time values.
export const WorkspaceLayoutSchema = z.object({
  timeframe: z.enum(TIMEFRAMES),
  style: z.enum(CHART_STYLES),
  priceScale: z.enum(PRICE_SCALES),
  range: z.enum(RANGES),
  indicators: z.array(z.enum(INDICATORS)),
  compareInstrumentId: z.string().nullable(),
  showEvents: z.boolean(),
  drawings: z.record(z.string(), z.array(DrawingSchema)),
});
export type WorkspaceLayout = z.infer<typeof WorkspaceLayoutSchema>;
export type WorkspaceDrawing = z.infer<typeof DrawingSchema>;

const BUILT_IN_LAYOUT: WorkspaceLayout = {
  timeframe: 'D',
  style: 'candlestick',
  priceScale: 'linear',
  range: '1Y',
  indicators: ['sma50', 'volume'],
  compareInstrumentId: null,
  showEvents: true,
  drawings: {},
};

// Built-in default per instrument type, used until the owner saves their own default for the type.
export function builtInLayoutFor(type: InstrumentTypeDto): WorkspaceLayout {
  switch (type) {
    case 'bond':
    case 'mutual_fund':
    case 'unlisted':
      return { ...BUILT_IN_LAYOUT, style: 'line', indicators: [] };
    case 'intraday':
      return { ...BUILT_IN_LAYOUT, timeframe: '5m', indicators: ['ema20', 'volume'] };
    case 'digital_asset':
    case 'currency_pair':
    case 'commodity':
      return { ...BUILT_IN_LAYOUT, indicators: ['sma20', 'sma50'] };
    case 'swing':
    case 'long_term':
    case 'etf':
    case 'ipo':
    case 'derivative':
      return BUILT_IN_LAYOUT;
  }
}

const RANGE_TRADING_DAYS: Readonly<Record<ChartRange, number | null>> = {
  '1M': 21,
  '3M': 63,
  '6M': 126,
  '1Y': 252,
  '3Y': 756,
  All: null,
};

// Bars to show for a range preset; intraday timeframes show the whole session.
export function visibleBarsFor(range: ChartRange, timeframe: Timeframe): number | null {
  const days = RANGE_TRADING_DAYS[range];
  if (days === null || isIntraday(timeframe)) {
    return null;
  }
  if (timeframe === 'W') {
    return Math.max(4, Math.round(days / 5));
  }
  return timeframe === 'M' ? Math.max(3, Math.round(days / 21)) : days;
}
