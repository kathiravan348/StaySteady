// Intraday candlestick bar generator for 1m, 5m, 15m, 1h intervals (M-05).
// Generates session-tagged bars (pre_market, regular, post_market) aligned to market schedules.

import { Decimal } from 'decimal.js';
import type { InstrumentDto, PriceBarDto, TradingSessionKindDto } from '../../schemas';
import { PriceBarSchema } from '../../schemas';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { currencyDecimals } from './values';
import type { IsoDate, IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toIsoDate, toIsoUtcTimestamp } from '../../../shared/types/dateTime';

export type IntradayTimeframe = '1m' | '5m' | '15m' | '1h';

export interface IntradayGeneratorOptions {
  readonly timeframe?: IntradayTimeframe;
  readonly date?: IsoDate;
  readonly includeExtendedHours?: boolean;
}

function timeframeMinutes(tf: IntradayTimeframe): number {
  switch (tf) {
    case '1m':
      return 1;
    case '5m':
      return 5;
    case '15m':
      return 15;
    case '1h':
      return 60;
  }
}

export function generateIntradayBars(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  options: IntradayGeneratorOptions = {},
): readonly PriceBarDto[] {
  const tf = options.timeframe ?? '5m';
  const tfMins = timeframeMinutes(tf);
  const targetDate: IsoDate = options.date ?? toIsoDate(ctx.referenceTime.slice(0, 10));
  const includeExt = options.includeExtendedHours ?? instrument.marketId === 'US';
  const stream = ctx.random.fork(`intraday:${instrument.id}:${targetDate}:${tf}`);
  const decimals = currencyDecimals(instrument.currency);

  const startHour = includeExt ? 4 : 9;
  const startMinute = includeExt ? 0 : 30;
  const endHour = includeExt ? 20 : 16;
  const endMinute = 0;

  const totalMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
  const stepCount = Math.max(1, Math.floor(totalMinutes / tfMins));

  // One price source (decision 19): the session opens at the last daily close before the date.
  const history = generatePriceHistoryForInstrument(ctx, instrument);
  const previous = [...history].reverse().find((bar) => bar.timestamp.slice(0, 10) < targetDate);
  let currentClose = new Decimal(previous?.close ?? history[history.length - 1]?.close ?? 100);
  const minuteVol = 0.0012 * Math.sqrt(tfMins);

  const bars: PriceBarDto[] = [];

  for (let i = 0; i < stepCount; i++) {
    const elapsedMinutes = i * tfMins;
    const currentTotalMin = startHour * 60 + startMinute + elapsedMinutes;
    const barHour = Math.floor(currentTotalMin / 60);
    const barMinute = currentTotalMin % 60;

    // Session determination (US market default reference)
    let session: TradingSessionKindDto = 'regular';
    if (barHour < 9 || (barHour === 9 && barMinute < 30)) {
      session = 'pre_market';
    } else if (barHour >= 16) {
      session = 'post_market';
    }

    const shock = stream.normal(0, minuteVol);
    const open = currentClose;
    const close = open.times(1 + shock).toDecimalPlaces(decimals);
    const intraHi = Math.abs(stream.normal(0, minuteVol * 0.4));
    const intraLo = Math.abs(stream.normal(0, minuteVol * 0.4));
    const high = Decimal.max(open, close)
      .times(1 + intraHi)
      .toDecimalPlaces(decimals);
    const low = Decimal.min(open, close)
      .times(1 - intraLo)
      .toDecimalPlaces(decimals);

    // Volume U-shape: elevated at market open (9:30) and close (16:00)
    const isMarketEdge = (barHour === 9 && barMinute >= 30) || barHour === 10 || barHour === 15;
    const volBase = isMarketEdge ? 45000 : session === 'regular' ? 15000 : 2500;
    const volume = Math.round(volBase * stream.float(0.7, 1.5) * tfMins);

    const pad = (n: number): string => String(n).padStart(2, '0');
    const timeIsoStr = `${targetDate}T${pad(barHour)}:${pad(barMinute)}:00Z`;
    const timestamp: IsoUtcTimestamp = toIsoUtcTimestamp(new Date(timeIsoStr));

    bars.push({
      timestamp,
      open: open.toFixed(decimals),
      high: high.toFixed(decimals),
      low: low.toFixed(decimals),
      close: close.toFixed(decimals),
      volume,
      session,
      isEstimated: false,
    });

    currentClose = close;
  }

  return parseGeneratedList(PriceBarSchema, bars, `intraday:${instrument.id}`);
}
