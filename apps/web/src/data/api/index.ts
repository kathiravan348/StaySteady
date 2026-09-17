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
export type { DecideApprovalVariables } from './tradingQueries';
export {
  useApprovalQueue,
  useDecideApproval,
  useOrderHistory,
  useSignalFeed,
  useSignals,
  useStrategies,
  useStrategyDraft,
  useStrategyLibrary,
  useStrategyVersions,
} from './tradingQueries';
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
export type { ChangeRiskLimitVariables } from './riskQueries';
export {
  useChangeRiskLimit,
  useEmergencyAction,
  useRiskBreaches,
  useRiskPanel,
} from './riskQueries';
export type {
  RevertBrokerConfigVariables,
  RevertMarketConfigVariables,
  RevertProviderConfigVariables,
  SaveBrokerConfigVariables,
  SaveMarketConfigVariables,
  SaveProviderConfigVariables,
} from './configQueries';
export {
  useBrokerConfigs,
  useMarketConfigs,
  useProviderConfigs,
  useRevertBrokerConfig,
  useRevertMarketConfig,
  useRevertProviderConfig,
  useSaveBrokerConfig,
  useSaveMarketConfig,
  useSaveProviderConfig,
  useTestBrokerConnection,
  useTestProviderConnection,
} from './configQueries';
export type { RevertConfigVariables, SaveConfigVariables } from './settingsConfigQueries';
export {
  useAlertRuleConfigs,
  useBaseCurrencyConfig,
  useCredentialConfigs,
  useCurrencyConfigs,
  useInstrumentTypeConfigs,
  useRevertAlertRuleConfig,
  useRevertBaseCurrency,
  useRevertCredentialConfig,
  useRevertCurrencyConfig,
  useRevertInstrumentTypeConfig,
  useSaveAlertRuleConfig,
  useSaveBaseCurrency,
  useSaveCredentialConfig,
  useSaveCurrencyConfig,
  useSaveInstrumentTypeConfig,
  useTestAlertRule,
} from './settingsConfigQueries';
export type { ReportRequestVariables, ScheduleAction } from './reportQueries';
export { useReport, useReportRuns, useReportSchedules, useScheduleAction } from './reportQueries';
export type { GoalAction } from './planningQueries';
export {
  useAllocationPlan,
  useGoalAction,
  useGoals,
  useProjection,
  useSaveAllocationPlan,
  useTradePreview,
} from './planningQueries';
export type { AlertActionVariables } from './alertCentreQueries';
export { useAlertAction, useAlertCentre } from './alertCentreQueries';
export { useAuditLog } from './auditQueries';
export { usePortfolioPerformance } from './performanceQueries';
export type { RecordValuationVariables } from './netWorthQueries';
export { useAddManualAsset, useNetWorth, useRecordValuation } from './netWorthQueries';
export type { JournalReviewVariables } from './journalQueries';
export { useJournal, useJournalReview } from './journalQueries';
export {
  useConfirmNominee,
  useContinuity,
  useRecordDrill,
  useResetHeartbeat,
  useUpdateInactivity,
} from './continuityQueries';
export {
  COMPLIANCE_KEY,
  useAddRestrictedInstrument,
  useCheckEligibility,
  useCompliance,
  useConfirmPolicyReview,
  useRemoveRestrictedInstrument,
} from './complianceQueries';
export {
  SCREENER_PRESETS_KEY,
  SCREENER_SEARCH_KEY,
  useScreenerPresets,
  useScreenerSearch,
} from './screenerQueries';
export {
  useInflationAssumptions,
  useOperatingPolicy,
  useRevertInflationAssumption,
  useRevertOperatingPolicy,
  useSaveInflationAssumption,
  useSaveOperatingPolicy,
} from './assumptionsConfigQueries';
export { useRevertTaxRuleSet, useSaveTaxRuleSet, useTaxRuleSets } from './taxRulesConfigQueries';
export { useLiquidityPlan, useSaveLiquidityPlan } from './planningLiquidityQueries';
export type { ResolveReconciliationVariables } from './reconciliationQueries';
export {
  useReconciliation,
  useResolveReconciliation,
  useRunReconciliation,
} from './reconciliationQueries';
export {
  useCounterparties,
  useCounterpartyExposure,
  useInflationHistory,
  useLossCarryForwards,
  useStrategyLifecycles,
} from './partTwoReferenceQueries';
