// Market, instrument, price and FX server state.

import { useQueries, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { z } from 'zod';

import type {
  FxRateDto,
  FxRateHistoryDto,
  InstrumentDto,
  MarketDto,
  MarketQuoteDto,
  PriceBarDto,
} from '../schemas';
import {
  FxRateHistorySchema,
  FxRateSchema,
  InstrumentSchema,
  MarketQuoteSchema,
  MarketSchema,
  PriceBarSchema,
} from '../schemas';
import { apiGet } from './apiClient';

// Live prices refresh every few seconds; configuration and daily history change rarely.
const QUOTE_REFRESH_MS = 5_000;
const SLOW_STALE_MS = 5 * 60_000;

const InstrumentListSchema = z.array(InstrumentSchema);
const MarketListSchema = z.array(MarketSchema);
const QuoteListSchema = z.array(MarketQuoteSchema);
const FxRateListSchema = z.array(FxRateSchema);
const FxHistoryListSchema = z.array(FxRateHistorySchema);
const PriceBarListSchema = z.array(PriceBarSchema);

export function useInstruments(): UseQueryResult<InstrumentDto[]> {
  return useQuery({
    queryKey: ['instruments'],
    queryFn: ({ signal }) => apiGet('/api/v1/instruments', InstrumentListSchema, signal),
    staleTime: SLOW_STALE_MS,
  });
}

export function useMarkets(): UseQueryResult<MarketDto[]> {
  return useQuery({
    queryKey: ['markets'],
    queryFn: ({ signal }) => apiGet('/api/v1/markets', MarketListSchema, signal),
    staleTime: SLOW_STALE_MS,
  });
}

export function useQuotes(instrumentIds: readonly string[]): UseQueryResult<MarketQuoteDto[]> {
  const ids = instrumentIds.join(',');
  return useQuery({
    queryKey: ['quotes', ids],
    queryFn: ({ signal }) =>
      apiGet(`/api/v1/quotes?instrumentIds=${encodeURIComponent(ids)}`, QuoteListSchema, signal),
    enabled: instrumentIds.length > 0,
    refetchInterval: QUOTE_REFRESH_MS,
  });
}

export function useFxRates(): UseQueryResult<FxRateDto[]> {
  return useQuery({
    queryKey: ['fx', 'rates'],
    queryFn: ({ signal }) => apiGet('/api/v1/fx/rates', FxRateListSchema, signal),
  });
}

export function useFxHistories(): UseQueryResult<FxRateHistoryDto[]> {
  return useQuery({
    queryKey: ['fx', 'history'],
    queryFn: ({ signal }) => apiGet('/api/v1/fx/history', FxHistoryListSchema, signal),
    staleTime: SLOW_STALE_MS,
  });
}

export interface PriceHistoriesResult {
  readonly histories: ReadonlyMap<string, readonly PriceBarDto[]>;
  readonly isPending: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
}

export function usePriceHistories(instrumentIds: readonly string[]): PriceHistoriesResult {
  const results = useQueries({
    queries: instrumentIds.map((id) => ({
      queryKey: ['prices', id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        apiGet(`/api/v1/instruments/${encodeURIComponent(id)}/prices`, PriceBarListSchema, signal),
      staleTime: SLOW_STALE_MS,
    })),
  });

  // Rebuild the map only when some series actually received new data, not on every render.
  const dataStamp = results.map((result) => result.dataUpdatedAt).join('|');
  const idKey = instrumentIds.join(',');
  const histories = useMemo(() => {
    const entries = results.flatMap((result, index) => {
      const id = instrumentIds[index];
      return id === undefined || result.data === undefined ? [] : [[id, result.data] as const];
    });
    return new Map<string, readonly PriceBarDto[]>(entries);
  }, [dataStamp, idKey]);

  return {
    histories,
    isPending: results.some((result) => result.isPending),
    error: results.find((result) => result.error !== null)?.error ?? null,
    refetch: () => {
      results.forEach((result) => {
        void result.refetch();
      });
    },
  };
}
