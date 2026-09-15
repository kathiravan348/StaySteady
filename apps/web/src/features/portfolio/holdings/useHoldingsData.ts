// Holdings data: every query the table needs, gathered into one state (UI spec 7.2, 10).
// News and strategy names are optional: if they fail, the table still shows with a warning.

import { useMemo } from 'react';

import {
  useBrokers,
  useFxHistories,
  useFxRates,
  useInstruments,
  useMarkets,
  useNewsItems,
  usePortfolioHoldings,
  useQuotes,
  useStrategies,
} from '../../../data/api';
import { useMarketSchedule } from '../../../providers/MarketScheduleProvider';
import { useSystemState } from '../../../providers/SystemStateProvider';
import type { MarketSessionState } from '../../../shared/marketTime';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { buildHoldingRows } from './model/holdingRows';
import type { HoldingRow } from './model/holdingTypes';

export type HoldingsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'empty' }
  | {
      readonly status: 'ready';
      readonly rows: readonly HoldingRow[];
      readonly baseCurrency: BaseCurrencyCode;
      readonly heldMarketIds: ReadonlySet<string>;
      readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
      readonly warnings: readonly string[];
    };

function oldestQuote(rows: readonly HoldingRow[]): IsoUtcTimestamp | null {
  let oldest: IsoUtcTimestamp | null = null;
  for (const row of rows) {
    if (row.quoteTimestamp !== null && (oldest === null || row.quoteTimestamp < oldest)) {
      oldest = row.quoteTimestamp;
    }
  }
  return oldest;
}

export function useHoldingsData(): HoldingsState {
  const { baseCurrency } = useSystemState();
  const { marketStatuses } = useMarketSchedule();
  const holdings = usePortfolioHoldings();
  const instruments = useInstruments();
  const markets = useMarkets();
  const brokers = useBrokers();
  const fxRates = useFxRates();
  const fxHistories = useFxHistories();
  const strategies = useStrategies();
  const news = useNewsItems();
  const heldIds = useMemo(
    () => holdings.data?.map((holding) => holding.instrumentId) ?? [],
    [holdings.data],
  );
  const quotes = useQuotes(heldIds);
  const marketStates = useMemo(
    () =>
      new Map<string, MarketSessionState>(
        marketStatuses.map((status) => [status.marketId, status.state]),
      ),
    [marketStatuses],
  );
  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const coreReady =
      holdings.data && instruments.data && markets.data && brokers.data && fxRates.data;
    if (!coreReady || !fxHistories.data || strategies.isPending || news.isPending) {
      return null;
    }
    if (heldIds.length > 0 && quotes.data === undefined) {
      return null;
    }
    return buildHoldingRows({
      holdings: holdings.data,
      quotes: quotes.data ?? [],
      instruments: instruments.data,
      markets: markets.data,
      brokers: brokers.data,
      strategies: strategies.data ?? [],
      fxRates: fxRates.data,
      fxHistories: fxHistories.data,
      news: news.data ?? [],
      marketStates,
      baseCurrency,
      today,
    });
  }, [
    holdings.data,
    instruments.data,
    markets.data,
    brokers.data,
    fxRates.data,
    fxHistories.data,
    strategies.isPending,
    strategies.data,
    news.isPending,
    news.data,
    quotes.data,
    heldIds.length,
    marketStates,
    baseCurrency,
    today,
  ]);

  const core = [holdings, instruments, markets, brokers, fxRates, fxHistories];
  const failed = [...core, ...(heldIds.length > 0 ? [quotes] : [])].find((query) => query.isError);
  if (failed !== undefined) {
    return {
      status: 'error',
      message: failed.error?.message ?? 'Unknown error',
      retry: () => {
        [...core, quotes, strategies, news].forEach((query) => {
          void query.refetch();
        });
      },
    };
  }
  if (holdings.data?.length === 0) {
    return { status: 'empty' };
  }
  if (rows === null) {
    return { status: 'loading' };
  }

  const warnings = [
    ...(strategies.isError ? ['Strategy names are unavailable, so strategy ids are shown.'] : []),
    ...(news.isError ? ['News is unavailable, so news flags are hidden.'] : []),
  ];
  return {
    status: 'ready',
    rows,
    baseCurrency,
    heldMarketIds: new Set(rows.map((row) => row.instrument.marketId)),
    oldestQuoteTimestamp: oldestQuote(rows),
    warnings,
  };
}
