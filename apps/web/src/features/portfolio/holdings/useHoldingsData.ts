// Holdings data: every query the table needs, gathered into one state (UI spec 7.2, 10).
// News and strategy names are optional: if they fail, the table still shows with a warning.

import type { PartialDataSource } from '@staysteady/ui';
import { useMemo } from 'react';

import {
  useBrokers,
  useClassificationIndex,
  useFxHistories,
  useFxRates,
  useInstrumentTypeConfigs,
  useInstruments,
  useMarkets,
  useNewsItems,
  usePortfolioHoldings,
  useQuotes,
  useStrategies,
  useTaxRuleSets,
} from '../../../data/api';
import { useMarketSchedule } from '../../../providers/MarketScheduleProvider';
import { useSystemState } from '../../../providers/SystemStateProvider';
import type { MarketSessionState } from '../../../shared/marketTime';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import { residenceRules } from '../../../shared/tax/taxRules';
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
      readonly unavailable: readonly PartialDataSource[];
      readonly retry: () => void;
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
  const taxRules = useTaxRuleSets();
  const instrumentTypes = useInstrumentTypeConfigs();
  const classification = useClassificationIndex();
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
      holdings.data &&
      instruments.data &&
      markets.data &&
      brokers.data &&
      fxRates.data &&
      taxRules.data &&
      instrumentTypes.data;
    if (
      !coreReady ||
      !fxHistories.data ||
      strategies.isPending ||
      news.isPending ||
      classification.isPending
    ) {
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
      classifications: classification.data?.rows ?? [],
      marketStates,
      baseCurrency,
      taxRules: residenceRules(taxRules.data.map((entry) => entry.config)),
      instrumentTypes: instrumentTypes.data.map((entry) => entry.config),
      today,
    });
  }, [
    holdings.data,
    instruments.data,
    markets.data,
    brokers.data,
    fxRates.data,
    fxHistories.data,
    taxRules.data,
    instrumentTypes.data,
    strategies.isPending,
    strategies.data,
    news.isPending,
    news.data,
    classification.isPending,
    classification.data,
    quotes.data,
    heldIds.length,
    marketStates,
    baseCurrency,
    today,
  ]);

  const core = [
    holdings,
    instruments,
    markets,
    brokers,
    fxRates,
    fxHistories,
    taxRules,
    instrumentTypes,
  ];
  const failed = [...core, ...(heldIds.length > 0 ? [quotes] : [])].find((query) => query.isError);
  if (failed !== undefined) {
    return {
      status: 'error',
      message: failed.error?.message ?? 'Unknown error',
      retry: () => {
        [...core, quotes, strategies, news, classification].forEach((query) => {
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

  const unavailable: PartialDataSource[] = [
    ...(strategies.isError
      ? [{ name: 'Strategies', impact: 'strategy ids are shown instead of names' }]
      : []),
    ...(news.isError ? [{ name: 'News', impact: 'news flags are hidden' }] : []),
    ...(classification.isError
      ? [
          {
            name: 'Classification',
            impact: 'sector, industry and group show as not classified',
          },
        ]
      : []),
  ];
  return {
    status: 'ready',
    rows,
    baseCurrency,
    heldMarketIds: new Set(rows.map((row) => row.instrument.marketId)),
    oldestQuoteTimestamp: oldestQuote(rows),
    unavailable,
    retry: () => {
      void strategies.refetch();
      void news.refetch();
      void classification.refetch();
    },
  };
}
