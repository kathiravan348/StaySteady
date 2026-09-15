// Branded domain identifiers (standards 6.4).
// Prevents accidental mixing of ticker symbols, orders, strategies, and account ids.

import type { Brand } from './brand';

export type InstrumentId = Brand<string, 'InstrumentId'>;
export type MarketId = Brand<string, 'MarketId'>;
export type StrategyId = Brand<string, 'StrategyId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type ExecutionId = Brand<string, 'ExecutionId'>;
export type PositionId = Brand<string, 'PositionId'>;
export type WatchlistId = Brand<string, 'WatchlistId'>;
export type BrokerId = Brand<string, 'BrokerId'>;
export type AccountId = Brand<string, 'AccountId'>;
export type AlertId = Brand<string, 'AlertId'>;
export type IncidentId = Brand<string, 'IncidentId'>;
export type BacktestId = Brand<string, 'BacktestId'>;

function assertNonEmpty(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`Expected non-empty string for ${label}, received: ${String(value)}`);
  }
  return value.trim();
}

export function toInstrumentId(value: unknown): InstrumentId {
  return assertNonEmpty(value, 'InstrumentId') as InstrumentId;
}

export function toMarketId(value: unknown): MarketId {
  return assertNonEmpty(value, 'MarketId').toUpperCase() as MarketId;
}

export function toStrategyId(value: unknown): StrategyId {
  return assertNonEmpty(value, 'StrategyId') as StrategyId;
}

export function toOrderId(value: unknown): OrderId {
  return assertNonEmpty(value, 'OrderId') as OrderId;
}

export function toExecutionId(value: unknown): ExecutionId {
  return assertNonEmpty(value, 'ExecutionId') as ExecutionId;
}

export function toPositionId(value: unknown): PositionId {
  return assertNonEmpty(value, 'PositionId') as PositionId;
}

export function toWatchlistId(value: unknown): WatchlistId {
  return assertNonEmpty(value, 'WatchlistId') as WatchlistId;
}

export function toBrokerId(value: unknown): BrokerId {
  return assertNonEmpty(value, 'BrokerId') as BrokerId;
}

export function toAccountId(value: unknown): AccountId {
  return assertNonEmpty(value, 'AccountId') as AccountId;
}

export function toAlertId(value: unknown): AlertId {
  return assertNonEmpty(value, 'AlertId') as AlertId;
}

export function toIncidentId(value: unknown): IncidentId {
  return assertNonEmpty(value, 'IncidentId') as IncidentId;
}

export function toBacktestId(value: unknown): BacktestId {
  return assertNonEmpty(value, 'BacktestId') as BacktestId;
}
