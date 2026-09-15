// Shared domain types barrel export (standards 6.4 and 8).

export type { Brand } from './brand';

export type {
  InstrumentId,
  MarketId,
  StrategyId,
  OrderId,
  ExecutionId,
  PositionId,
  WatchlistId,
  BrokerId,
  AccountId,
  AlertId,
  IncidentId,
  BacktestId,
} from './identifiers';

export {
  toInstrumentId,
  toMarketId,
  toStrategyId,
  toOrderId,
  toExecutionId,
  toPositionId,
  toWatchlistId,
  toBrokerId,
  toAccountId,
  toAlertId,
  toIncidentId,
  toBacktestId,
} from './identifiers';

export type { Quantity, Percentage, Ratio, BasisPoints } from './quantities';

export {
  toQuantity,
  toPercentage,
  toRatio,
  toBasisPoints,
  percentageToRatio,
  ratioToPercentage,
  percentageToBasisPoints,
  basisPointsToPercentage,
  ratioToBasisPoints,
  basisPointsToRatio,
} from './quantities';

export type {
  CurrencyCode,
  BaseCurrencyCode,
  BaseCurrencyAmount,
  LocalCurrencyAmount,
  FxRate,
} from './currency';

export {
  SUPPORTED_CURRENCIES,
  BASE_CURRENCIES,
  isCurrencyCode,
  isBaseCurrencyCode,
  toCurrencyCode,
  toBaseCurrencyCode,
  createFxRate,
} from './currency';

export type { IsoUtcTimestamp, IsoDate, IanaTimeZone, MarketLocalTimestamp } from './dateTime';

export {
  SUPPORTED_TIMEZONES,
  isIsoUtcTimestamp,
  isIsoDate,
  toIsoUtcTimestamp,
  toIsoDate,
  nowUtc,
  toMarketLocalTimestamp,
} from './dateTime';
