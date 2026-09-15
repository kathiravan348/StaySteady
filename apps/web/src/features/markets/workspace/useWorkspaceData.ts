// Instrument workspace data: which instrument the route names, and its chart bars (UI spec 7.4, 10).

import { useMemo } from 'react';

import { useInstruments, useIntradayBars, useMarkets, usePriceHistories } from '../../../data/api';
import type { InstrumentDto, MarketDto, PriceBarDto } from '../../../data/schemas';
import type { ChartSeriesData } from './model/chartData';
import { aggregateSeries, dailySeries, intradaySeries } from './model/chartData';
import type { Timeframe } from './model/workspaceLayout';
import { isIntraday } from './model/workspaceLayout';

export type WorkspaceInstrumentState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'not-found'; readonly ticker: string }
  | {
      readonly status: 'ready';
      readonly instrument: InstrumentDto;
      readonly market: MarketDto | null;
      readonly instruments: readonly InstrumentDto[];
      readonly markets: readonly MarketDto[];
    };

export function useWorkspaceInstrument(ticker: string): WorkspaceInstrumentState {
  const instruments = useInstruments();
  const markets = useMarkets();
  const failed = [instruments, markets].find((query) => query.isError);
  if (failed !== undefined) {
    return {
      status: 'error',
      message: failed.error?.message ?? 'Unknown error',
      retry: () => {
        void instruments.refetch();
        void markets.refetch();
      },
    };
  }
  if (instruments.data === undefined || markets.data === undefined) {
    return { status: 'loading' };
  }
  const needle = ticker.toLowerCase();
  const instrument = instruments.data.find(
    (item) => item.symbol.toLowerCase() === needle || item.id === ticker,
  );
  if (instrument === undefined) {
    return { status: 'not-found', ticker };
  }
  return {
    status: 'ready',
    instrument,
    market: markets.data.find((item) => item.marketId === instrument.marketId) ?? null,
    instruments: instruments.data,
    markets: markets.data,
  };
}

export type ChartDataState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'empty' }
  | { readonly status: 'ready'; readonly data: ChartSeriesData };

export interface WorkspaceChartData {
  readonly chart: ChartDataState;
  // Daily history is always loaded: it feeds the period statistics in the quote panel.
  readonly daily: readonly PriceBarDto[] | null;
}

export function useWorkspaceChartData(
  instrument: InstrumentDto,
  market: MarketDto | null,
  timeframe: Timeframe,
): WorkspaceChartData {
  const ids = useMemo(() => [instrument.id], [instrument.id]);
  const history = usePriceHistories(ids);
  const intraday = useIntradayBars(instrument.id, isIntraday(timeframe) ? timeframe : null);
  const holidays = useMemo(() => market?.holidays.map((holiday) => holiday.date) ?? [], [market]);
  const daily = history.histories.get(instrument.id) ?? null;

  const data = useMemo((): ChartSeriesData | null => {
    if (isIntraday(timeframe)) {
      return intraday.data === undefined ? null : intradaySeries(intraday.data);
    }
    if (daily === null) return null;
    return timeframe === 'D'
      ? dailySeries(daily, holidays)
      : aggregateSeries(dailySeries(daily, []).points, timeframe);
  }, [timeframe, intraday.data, daily, holidays]);

  const error = isIntraday(timeframe) ? intraday.error : history.error;
  if (error !== null) {
    return {
      daily,
      chart: {
        status: 'error',
        message: error.message,
        retry: () => {
          if (isIntraday(timeframe)) void intraday.refetch();
          else history.refetch();
        },
      },
    };
  }
  if (data === null) return { daily, chart: { status: 'loading' } };
  return {
    daily,
    chart: data.points.length === 0 ? { status: 'empty' } : { status: 'ready', data },
  };
}
