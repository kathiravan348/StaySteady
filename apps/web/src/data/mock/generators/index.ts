// Mock data generator toolkit (M-03..M-15).
// Rule: mock data never calls Math.random — always a SeededRandom forked from the mock context.

export type { RandomSource } from './prng';
export { hashSeed, mulberry32 } from './prng';

export type { SeededRandom, WeightedOption } from './seededRandom';
export { createSeededRandom } from './seededRandom';

export type { MockGeneratorContext, MockGeneratorOptions } from './mockContext';
export { DEFAULT_MOCK_SEED, createMockGeneratorContext, startOfUtcDay } from './mockContext';

export { MockDataError, parseGenerated, parseGeneratedList } from './validated';

export type { DecimalRange, MoneyRange } from './values';
export {
  addDays,
  currencyDecimals,
  daysBetween,
  randomDateBetween,
  randomDecimalString,
  randomMoney,
  randomTimestampBetween,
  sequentialId,
  toUtcDate,
  directionOf,
  signedChange,
} from './values';

// M-07 Markets & Instruments
export { CANONICAL_MARKETS, getCanonicalMarkets, getMarketById } from './markets';
export {
  CANONICAL_INSTRUMENTS,
  getCanonicalInstruments,
  getInstrumentById,
  generateInitialQuotes,
} from './instruments';

// M-04 Price History
export { PRICE_HISTORY_ORIGIN_DATE, generatePriceHistoryForInstrument } from './priceHistory';

// M-05 Intraday Bars
export type { IntradayTimeframe, IntradayGeneratorOptions } from './intraday';
export { generateIntradayBars } from './intraday';

// M-06 Corporate Actions
export {
  CANONICAL_CORPORATE_ACTIONS,
  getCanonicalCorporateActions,
  getCorporateActionsForInstrument,
} from './corporateActions';

// M-08 FX History
export { generateFxHistories, generateCurrentFxRates } from './fxHistory';

// M-09 Portfolio (brokers and holding profiles added session 21)
export { CANONICAL_BROKERS, getCanonicalBrokers } from './brokers';
export type { PortfolioDataBundle } from './portfolio';
export { generatePortfolioData } from './portfolio';

// M-10 Backtests
export type { BacktestTradeItem } from './backtests';
export { generateBacktestResults, generateBacktestTrades } from './backtests';

// Session 26: backtest setup (UI spec 7.9)
export type { BacktestRunState } from './backtestSetup';
export { describeRun, generateDataCoverage, generateMarketCostDefaults } from './backtestSetup';

// Session 27: backtest result detail (UI spec 7.10)
export type { EquityPoint } from './backtestDetail';
export { generateBacktestDetail } from './backtestDetail';

// M-11 News & Events
export { generateNewsItems } from './newsEvents';
export { generateCalendarEvents } from './calendarEvents';

// M-12 Trading & Strategies
export { generateStrategies, generateSignals, generateOrders, generateApprovals } from './trading';

// M-13 Health, Alerts, Incidents & Audit
export { generateHealthServices, generateAlerts, generateAuditLogs } from './healthAlerts';

// Session 25: System Health detail data
export {
  generateAlertChannels,
  generateComponentHealth,
  generateDataFreshness,
  generateIncidentHistory,
  generateSourceReliability,
  testAlertChannel,
} from './healthDetails';

// Session 23: fundamentals and watchlists for the instrument workspace
export { generateInstrumentFundamentals, generateWatchlists } from './researchData';

// M-15 Live Ticking
export type { QuoteTickListener } from './ticker';
export { tickQuotes, liveTicker } from './ticker';

// Session 29: strategy library entries (UI spec 7.7)
export { generateStrategyLibrary } from './strategyLibrary';

// Session 30: strategy definitions for the editor (UI spec 7.8)
export { generateStrategyDraft, generateStrategyVersions } from './strategyDrafts';

// Session 31: signals feed and approval queue (UI spec 7.12)
export { generateSignalFeed } from './signalFeed';
export { generateApprovalQueue } from './approvalQueue';

// Session 32: order history with broker, fees, slippage and lifecycle (UI spec 7.13)
export { generateOrderHistory } from './orderHistory';

// Session 33: risk and safety panel (UI spec 7.14)
export { generateRiskLimits } from './riskLimits';
export { generateRiskPanel } from './riskPanel';
export { generateRiskBreaches } from './riskBreaches';

// Session 34: configuration, markets (UI spec 7.18)
export { marketConfigHealth, seedMarketConfigs, seedMarketHistory } from './marketConfig';

// Session 38: configuration, data providers (UI spec 7.18)
export { providerConfigHealth, seedProviderConfigs, seedProviderHistory } from './providerConfig';
export { testProviderConnection } from './providerConnectionTest';

// Session 39: configuration, brokers (UI spec 7.18)
export { brokerConfigHealth, seedBrokerConfigs, seedBrokerHistory } from './brokerConfig';
export { testBrokerConnection } from './brokerConnectionTest';

// Session 40: configuration, instrument types, currencies and alert rules (UI spec 7.18)
export {
  heldSymbols,
  instrumentTypeConfigHealth,
  seedInstrumentTypeConfigs,
  seedInstrumentTypeHistory,
} from './instrumentTypeConfig';
export {
  currencyConfigHealth,
  seedBaseCurrency,
  seedCurrencyConfigs,
  seedCurrencyHistory,
} from './currencyConfig';
export {
  alertRuleConfigHealth,
  seedAlertRuleHistory,
  seedAlertRules,
  testAlertRule,
} from './alertRuleConfig';

// Session 42: reports (UI spec 7.16)
export type { ValuationContext } from './reportValuation';
export { createValuationContext } from './reportValuation';
export type { ReportRequest } from './reports';
export {
  buildReport,
  lastCompletePeriod,
  nextRunDate,
  seedReportRuns,
  seedReportSchedules,
} from './reports';
