// Data access layer: typed, schema-validated requests and TanStack Query hooks (UI spec 14).

export { ApiError, apiGet } from './apiClient';
export { queryClient } from './queryClient';
export { fxTableFromDtos, moneyFromDto } from './mappers';
export {
  useBrokers,
  usePortfolioHoldings,
  usePortfolioSummary,
  useTransactions,
} from './portfolioQueries';
export { useSignals, useStrategies } from './tradingQueries';
export { useWatchlists } from './watchlistQueries';
export type { IntradayTimeframe, PriceHistoriesResult } from './marketQueries';
export {
  useCorporateActions,
  useFxHistories,
  useFxRates,
  useInstrumentFundamentals,
  useInstruments,
  useIntradayBars,
  useMarkets,
  usePriceHistories,
  useQuotes,
} from './marketQueries';
export { useAlerts, useApprovals, useSystemHealth } from './systemQueries';
export { useCalendarEvents, useNewsItems } from './newsQueries';
