// Core Overview data: holdings valued at live quotes in the selected base currency.
// Side sections load their own data, so one failing feed never blanks the whole page (UI spec 10).

import { useMemo } from 'react';

import {
  useClassificationIndex,
  useFxRates,
  useInstruments,
  useMarkets,
  usePortfolioHoldings,
  usePortfolioSummary,
  useQuotes,
} from '../../data/api';
import type { HoldingDto, InstrumentDto } from '../../data/schemas';
import { useSystemState } from '../../providers/SystemStateProvider';
import type { BaseMoney, PortfolioOverview } from './model/overviewTypes';
import { buildPortfolioOverview } from './model/portfolioOverview';

export type OverviewCoreState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'empty'; readonly cash: BaseMoney }
  | {
      readonly status: 'ready';
      readonly overview: PortfolioOverview;
      readonly holdings: readonly HoldingDto[];
      readonly instruments: readonly InstrumentDto[];
      readonly heldInstrumentIds: ReadonlySet<string>;
      readonly heldMarketIds: ReadonlySet<string>;
    };

export function useOverviewCore(): OverviewCoreState {
  const { baseCurrency } = useSystemState();
  const holdings = usePortfolioHoldings();
  const summary = usePortfolioSummary();
  const instruments = useInstruments();
  const markets = useMarkets();
  const fxRates = useFxRates();
  const classification = useClassificationIndex();
  const heldIds = useMemo(
    () => holdings.data?.map((holding) => holding.instrumentId) ?? [],
    [holdings.data],
  );
  const quotes = useQuotes(heldIds);

  const overview = useMemo(() => {
    const quotesReady = heldIds.length === 0 || quotes.data !== undefined;
    if (
      !holdings.data ||
      !summary.data ||
      !instruments.data ||
      !markets.data ||
      !fxRates.data ||
      !classification.data
    ) {
      return null;
    }
    if (!quotesReady) {
      return null;
    }
    return buildPortfolioOverview({
      holdings: holdings.data,
      quotes: quotes.data ?? [],
      instruments: instruments.data,
      markets: markets.data,
      fxRates: fxRates.data,
      summary: summary.data,
      baseCurrency,
      classifications: classification.data.rows,
    });
  }, [
    holdings.data,
    summary.data,
    instruments.data,
    markets.data,
    fxRates.data,
    classification.data,
    quotes.data,
    heldIds.length,
    baseCurrency,
  ]);

  const heldSets = useMemo(() => {
    const held = overview?.positions ?? [];
    return {
      instruments: new Set<string>(held.map((position) => position.instrument.id)),
      markets: new Set<string>(held.map((position) => position.instrument.marketId)),
    };
  }, [overview?.positions]);

  const queries = [holdings, summary, instruments, markets, fxRates, classification];
  const failed = [...queries, ...(heldIds.length > 0 ? [quotes] : [])].find((q) => q.isError);
  if (failed !== undefined) {
    return {
      status: 'error',
      message: failed.error?.message ?? 'Unknown error',
      retry: () => {
        [...queries, quotes].forEach((query) => {
          void query.refetch();
        });
      },
    };
  }
  if (overview === null) {
    return { status: 'loading' };
  }
  if (overview.positions.length === 0) {
    return { status: 'empty', cash: overview.headline.cash };
  }
  return {
    status: 'ready',
    overview,
    holdings: holdings.data ?? [],
    instruments: instruments.data ?? [],
    heldInstrumentIds: heldSets.instruments,
    heldMarketIds: heldSets.markets,
  };
}
