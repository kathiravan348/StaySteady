// Data access layer: typed, schema-validated requests and TanStack Query hooks (UI spec 14).

export { ApiError, apiGet } from './apiClient';
export { queryClient } from './queryClient';
export { fxTableFromDtos, moneyFromDto } from './mappers';
export { useBrokers, usePortfolioHoldings, usePortfolioSummary } from './portfolioQueries';
export { useStrategies } from './tradingQueries';
export type { PriceHistoriesResult } from './marketQueries';
export {
  useFxHistories,
  useFxRates,
  useInstruments,
  useMarkets,
  usePriceHistories,
  useQuotes,
} from './marketQueries';
export { useAlerts, useApprovals, useSystemHealth } from './systemQueries';
export { useCalendarEvents, useNewsItems } from './newsQueries';
