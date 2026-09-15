// Watchlists screen data: the lists plus the instrument and market reference data (UI spec 7.5, 10).
// A failed background refresh keeps the last lists on screen and reports the failure instead.

import { useInstruments, useMarkets, useWatchlists } from '../../../data/api';
import type { InstrumentDto, MarketDto, WatchlistDto } from '../../../data/schemas';

export type WatchlistsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | {
      readonly status: 'ready';
      readonly lists: readonly WatchlistDto[];
      readonly instruments: readonly InstrumentDto[];
      readonly markets: readonly MarketDto[];
      // Set when a refresh failed but earlier data is still shown.
      readonly refreshError: string | null;
    };

export function useWatchlistsData(): WatchlistsState {
  const watchlists = useWatchlists();
  const instruments = useInstruments();
  const markets = useMarkets();
  const queries = [watchlists, instruments, markets];
  const retry = (): void => {
    queries.forEach((query) => {
      void query.refetch();
    });
  };

  const failedWithoutData = queries.find((query) => query.isError && query.data === undefined);
  if (failedWithoutData !== undefined) {
    return {
      status: 'error',
      message: failedWithoutData.error?.message ?? 'Unknown error',
      retry,
    };
  }
  if (
    watchlists.data === undefined ||
    instruments.data === undefined ||
    markets.data === undefined
  ) {
    return { status: 'loading' };
  }
  return {
    status: 'ready',
    lists: watchlists.data,
    instruments: instruments.data,
    markets: markets.data,
    refreshError: queries.find((query) => query.isError)?.error?.message ?? null,
  };
}
