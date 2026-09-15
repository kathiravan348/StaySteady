// Watchlist rows, per-list summary and ordering helpers (UI spec 7.5). Pure.

import { moneyFromDto } from '../../../../data/api/mappers';
import type {
  InstrumentDto,
  MarketDto,
  MarketQuoteDto,
  PriceBarDto,
  WatchlistDto,
} from '../../../../data/schemas';
import { directionOfNumber, humanizeToken } from '../../../../shared/format';
import type { NumberDirection } from '../../../../shared/format';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { Money } from '../../../../shared/money';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';

export interface WatchlistRow {
  readonly id: string;
  readonly instrument: InstrumentDto;
  readonly marketName: string;
  readonly typeLabel: string;
  readonly marketState: MarketSessionState | null;
  readonly lastPrice: Money | null;
  readonly change: Money | null;
  readonly changePercent: number | null;
  readonly direction: NumberDirection;
  readonly dayLow: Money | null;
  readonly dayHigh: Money | null;
  readonly volume: number | null;
  // Recent closes for the inline sparkline, oldest first.
  readonly closes: readonly number[];
  readonly quoteTimestamp: IsoUtcTimestamp | null;
}

export interface WatchlistSummary {
  readonly count: number;
  readonly up: number;
  readonly down: number;
  readonly flat: number;
  readonly averageMovePercent: number | null;
}

export interface RowSources {
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly quotes: readonly MarketQuoteDto[];
  readonly histories: ReadonlyMap<string, readonly PriceBarDto[]>;
  readonly marketStates: ReadonlyMap<string, MarketSessionState>;
}

export const SPARKLINE_BARS = 30;

// Unknown instrument ids (for example a delisted symbol) are skipped rather than shown blank.
export function buildWatchlistRows(list: WatchlistDto, sources: RowSources): WatchlistRow[] {
  return list.instrumentIds.flatMap((instrumentId): WatchlistRow[] => {
    const instrument = sources.instruments.find((item) => item.id === instrumentId);
    if (instrument === undefined) return [];
    const quote = sources.quotes.find((item) => item.instrumentId === instrumentId);
    const history = sources.histories.get(instrumentId) ?? [];
    return [
      {
        id: instrumentId,
        instrument,
        marketName:
          sources.markets.find((market) => market.marketId === instrument.marketId)?.name ??
          instrument.marketId,
        typeLabel: humanizeToken(instrument.type),
        marketState: sources.marketStates.get(instrument.marketId) ?? null,
        lastPrice: quote === undefined ? null : moneyFromDto(quote.lastPrice),
        change: quote === undefined ? null : moneyFromDto(quote.change),
        changePercent: quote?.changePercent ?? null,
        direction: directionOfNumber(quote?.changePercent ?? 0),
        dayLow: quote === undefined ? null : moneyFromDto(quote.low),
        dayHigh: quote === undefined ? null : moneyFromDto(quote.high),
        volume: quote?.volume ?? null,
        closes: history.slice(-SPARKLINE_BARS).map((bar) => Number(bar.close)),
        quoteTimestamp: quote?.timestamp ?? null,
      },
    ];
  });
}

export function summariseWatchlist(
  instrumentIds: readonly string[],
  quotes: readonly MarketQuoteDto[],
): WatchlistSummary {
  const moves = instrumentIds.flatMap((id) => {
    const quote = quotes.find((item) => item.instrumentId === id);
    return quote === undefined ? [] : [quote.changePercent];
  });
  return {
    count: instrumentIds.length,
    up: moves.filter((move) => move > 0).length,
    down: moves.filter((move) => move < 0).length,
    flat: moves.filter((move) => move === 0).length,
    averageMovePercent:
      moves.length === 0
        ? null
        : Math.round((moves.reduce((sum, move) => sum + move, 0) / moves.length) * 100) / 100,
  };
}

export function reorderIds(
  ids: readonly string[],
  moved: readonly string[],
  targetId: string,
  position: 'before' | 'after',
): string[] {
  const movedIds = ids.filter((id) => moved.includes(id));
  const rest = ids.filter((id) => !moved.includes(id));
  const index = rest.indexOf(targetId);
  const insertAt = index < 0 ? rest.length : position === 'before' ? index : index + 1;
  return [...rest.slice(0, insertAt), ...movedIds, ...rest.slice(insertAt)];
}

export function moveByOffset(ids: readonly string[], id: string, offset: -1 | 1): string[] {
  const index = ids.indexOf(id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= ids.length) return [...ids];
  const next = [...ids];
  const other = next[target];
  if (other === undefined) return next;
  next[target] = id;
  next[index] = other;
  return next;
}
