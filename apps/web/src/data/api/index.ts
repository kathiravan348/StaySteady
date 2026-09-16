// Data access layer: typed, schema-validated requests and TanStack Query hooks (UI spec 14).

export { ApiError, apiGet, apiSend } from './apiClient';
export { queryClient } from './queryClient';
export { fxTableFromDtos, moneyFromDto } from './mappers';
export {
  useBrokers,
  usePortfolioHoldings,
  usePortfolioSummary,
  useTransactions,
} from './portfolioQueries';
export { useSignals, useStrategies, useStrategyLibrary } from './tradingQueries';
export type {
  MoveInstrumentVariables,
  SetInstrumentsVariables,
  WatchlistMutation,
} from './watchlistQueries';
export {
  useCreateWatchlist,
  useDeleteWatchlist,
  useMoveWatchlistInstrument,
  useRenameWatchlist,
  useSetWatchlistInstruments,
  useWatchlists,
} from './watchlistQueries';
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
export type { BacktestTradeDto } from './researchQueries';
export {
  backtestDetailQueryOptions,
  useBacktest,
  useBacktestCostDefaults,
  useBacktestDetail,
  useBacktestRun,
  useBacktests,
  useBacktestTrades,
  useCancelBacktestRun,
  useDataCoverage,
  useStartBacktestRun,
} from './researchQueries';
export {
  useAlertChannels,
  useComponentHealth,
  useDataFreshness,
  useIncidents,
  useSourceReliability,
  useTestAlertChannel,
} from './healthQueries';
export { useCalendarEvents, useNewsItems } from './newsQueries';
