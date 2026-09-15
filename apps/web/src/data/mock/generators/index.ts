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

// M-09 Portfolio
export type { PortfolioDataBundle } from './portfolio';
export { generatePortfolioData } from './portfolio';

// M-10 Backtests
export type { BacktestTradeItem } from './backtests';
export { generateBacktestResults, generateBacktestTrades } from './backtests';

// M-11 News & Events
export { generateNewsItems, generateCalendarEvents } from './newsEvents';

// M-12 Trading & Strategies
export { generateStrategies, generateSignals, generateOrders, generateApprovals } from './trading';

// M-13 Health, Alerts, Incidents & Audit
export {
  generateHealthServices,
  generateAlerts,
  generateIncidents,
  generateAuditLogs,
} from './healthAlerts';

// M-15 Live Ticking
export type { QuoteTickListener } from './ticker';
export { tickQuotes, liveTicker } from './ticker';
