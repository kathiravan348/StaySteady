// Positions data: every query the screen needs, gathered into one state. Order history is optional:
// if it fails, positions still show with a warning that working orders are unknown.

import { useMemo } from 'react';

import {
  useBrokers,
  useFxRates,
  useInstruments,
  useOrderHistory,
  usePortfolioHoldings,
  useQuotes,
  useStrategies,
} from '../../../data/api';
import { useSystemState } from '../../../providers/SystemStateProvider';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import type { PositionRow } from './model/positionRows';
import { buildPositionRows } from './model/positionRows';

export type PositionsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string; readonly retry: () => void }
  | { readonly status: 'empty' }
  | {
      readonly status: 'ready';
      readonly rows: readonly PositionRow[];
      readonly baseCurrency: BaseCurrencyCode;
      readonly heldMarketIds: ReadonlySet<string>;
      readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
      readonly ordersUnavailable: boolean;
    };

export function usePositionsData(): PositionsState {
  const { baseCurrency } = useSystemState();
  const holdings = usePortfolioHoldings();
  const strategies = useStrategies();
  const instruments = useInstruments();
  const brokers = useBrokers();
  const fxRates = useFxRates();
  const orders = useOrderHistory();
  const automatedIds = useMemo(
    () =>
      holdings.data
        ?.filter((holding) => holding.openedByStrategyId !== undefined)
        .map((holding) => holding.instrumentId) ?? [],
    [holdings.data],
  );
  const quotes = useQuotes(automatedIds);

  const rows = useMemo(() => {
    if (
      !holdings.data ||
      !strategies.data ||
      !instruments.data ||
      !brokers.data ||
      !fxRates.data ||
      orders.isPending ||
      (automatedIds.length > 0 && quotes.data === undefined)
    ) {
      return null;
    }
    return buildPositionRows({
      holdings: holdings.data,
      strategies: strategies.data,
      instruments: instruments.data,
      brokers: brokers.data,
      quotes: quotes.data ?? [],
      fxRates: fxRates.data,
      orders: orders.data ?? [],
      baseCurrency,
    });
  }, [
    holdings.data,
    strategies.data,
    instruments.data,
    brokers.data,
    fxRates.data,
    orders.isPending,
    orders.data,
    quotes.data,
    automatedIds.length,
    baseCurrency,
  ]);

  const core = [holdings, strategies, instruments, brokers, fxRates];
  const failed = [...core, ...(automatedIds.length > 0 ? [quotes] : [])].find(
    (query) => query.isError,
  );
  if (failed !== undefined) {
    return {
      status: 'error',
      message: failed.error?.message ?? 'Unknown error',
      retry: () => {
        [...core, quotes, orders].forEach((query) => {
          void query.refetch();
        });
      },
    };
  }
  if (holdings.data !== undefined && automatedIds.length === 0) {
    return { status: 'empty' };
  }
  if (rows === null) {
    return { status: 'loading' };
  }
  const timestamps = rows
    .map((row) => row.quoteTimestamp)
    .filter((stamp): stamp is IsoUtcTimestamp => stamp !== null)
    .sort();
  return {
    status: 'ready',
    rows,
    baseCurrency,
    heldMarketIds: new Set(rows.map((row) => String(row.instrument.marketId))),
    oldestQuoteTimestamp: timestamps[0] ?? null,
    ordersUnavailable: orders.isError,
  };
}
