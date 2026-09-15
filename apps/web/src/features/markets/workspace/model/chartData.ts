// Price bars shaped for the workspace chart (UI spec 7.4). Pure.
// Prices become numbers here for drawing only; money arithmetic stays in decimal.js (decision 4).

import type { TradingBar, TradingChartBar } from '@staysteady/ui';

import type { PriceBarDto } from '../../../../data/schemas';

export interface ChartPoint {
  // "YYYY-MM-DD" for daily, weekly and monthly bars; Unix seconds for intraday bars.
  readonly time: string | number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly isExtendedHours: boolean;
}

export interface ChartSeriesData {
  readonly bars: readonly TradingChartBar[];
  // Real bars only, in time order: the input for indicators, markers and copied data.
  readonly points: readonly ChartPoint[];
}

function toPoint(bar: PriceBarDto, time: string | number): ChartPoint {
  return {
    time,
    open: Number(bar.open),
    high: Number(bar.high),
    low: Number(bar.low),
    close: Number(bar.close),
    volume: bar.volume,
    isExtendedHours: bar.session !== 'regular',
  };
}

const toTradingBar = (point: ChartPoint): TradingBar => ({
  time: point.time,
  open: point.open,
  high: point.high,
  low: point.low,
  close: point.close,
  ...(point.isExtendedHours ? { isExtendedHours: true } : {}),
});

const isWeekday = (date: string): boolean => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
};

// Weekday market holidays become visible gaps instead of being compressed away (UI spec 7.4).
export function dailySeries(
  bars: readonly PriceBarDto[],
  holidayDates: readonly string[],
): ChartSeriesData {
  const points = bars.map((bar) => toPoint(bar, bar.timestamp.slice(0, 10)));
  const first = points[0]?.time;
  const last = points[points.length - 1]?.time;
  const tradingDates = new Set(points.map((point) => point.time));
  const gaps: TradingChartBar[] =
    first === undefined || last === undefined
      ? []
      : holidayDates
          .filter(
            (date) => date > first && date < last && isWeekday(date) && !tradingDates.has(date),
          )
          .map((date) => ({ time: date, isGap: true }));
  const all = [...points.map(toTradingBar), ...gaps].sort((a, b) =>
    String(a.time).localeCompare(String(b.time)),
  );
  return { bars: all, points };
}

function periodStart(date: string, frame: 'W' | 'M'): string {
  if (frame === 'M') {
    return date.slice(0, 7);
  }
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

// Weekly and monthly bars are dated by their first trading day.
export function aggregateSeries(points: readonly ChartPoint[], frame: 'W' | 'M'): ChartSeriesData {
  const groups = new Map<string, ChartPoint[]>();
  points.forEach((point) => {
    const key = periodStart(String(point.time), frame);
    groups.set(key, [...(groups.get(key) ?? []), point]);
  });
  const aggregated = [...groups.values()].flatMap((group): ChartPoint[] => {
    const first = group[0];
    const last = group[group.length - 1];
    if (first === undefined || last === undefined) {
      return [];
    }
    return [
      {
        time: first.time,
        open: first.open,
        high: Math.max(...group.map((point) => point.high)),
        low: Math.min(...group.map((point) => point.low)),
        close: last.close,
        volume: group.reduce((sum, point) => sum + point.volume, 0),
        isExtendedHours: false,
      },
    ];
  });
  return { bars: aggregated.map(toTradingBar), points: aggregated };
}

export function intradaySeries(bars: readonly PriceBarDto[]): ChartSeriesData {
  const points = bars.map((bar) => toPoint(bar, Math.floor(Date.parse(bar.timestamp) / 1000)));
  return { bars: points.map(toTradingBar), points };
}

export function pointsToCsv(points: readonly ChartPoint[]): string {
  const rows = points.map((point) =>
    [
      typeof point.time === 'number' ? new Date(point.time * 1000).toISOString() : point.time,
      point.open,
      point.high,
      point.low,
      point.close,
      point.volume,
      point.isExtendedHours ? 'extended' : 'regular',
    ].join(','),
  );
  return `${['time', 'open', 'high', 'low', 'close', 'volume', 'session'].join(',')}\n${rows.join('\n')}\n`;
}
