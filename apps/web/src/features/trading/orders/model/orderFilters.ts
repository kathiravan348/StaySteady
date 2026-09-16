// Filtering the order history (UI spec 7.13): by broker, market, status, strategy and date.

import type { OrderHistoryEntryDto } from '../../../../data/schemas';
import type { OrderStatusDto } from '../../../../data/schemas';

export const ALL = 'all';
// Orders raised by hand rather than by a strategy.
export const MANUAL = 'manual';

export interface OrderFilters {
  readonly broker: string;
  readonly market: string;
  readonly status: OrderStatusDto | typeof ALL;
  readonly strategy: string;
  readonly from: string;
  readonly to: string;
}

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  broker: ALL,
  market: ALL,
  status: ALL,
  strategy: ALL,
  from: '',
  to: '',
};

export const STATUS_LABELS: Readonly<Record<OrderStatusDto, string>> = {
  pending: 'Pending',
  partially_filled: 'Partly filled',
  filled: 'Filled',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  unconfirmed: 'Unconfirmed',
};

function dayOf(entry: OrderHistoryEntryDto): string {
  return String(entry.createdAt).slice(0, 10);
}

export function applyOrderFilters(
  entries: readonly OrderHistoryEntryDto[],
  filters: OrderFilters,
): readonly OrderHistoryEntryDto[] {
  return entries.filter((entry) => {
    const day = dayOf(entry);
    const strategyKey = entry.strategyId === null ? MANUAL : String(entry.strategyId);
    return (
      (filters.broker === ALL || entry.brokerId === filters.broker) &&
      (filters.market === ALL || entry.marketId === filters.market) &&
      (filters.status === ALL || entry.status === filters.status) &&
      (filters.strategy === ALL || strategyKey === filters.strategy) &&
      (filters.from === '' || day >= filters.from) &&
      (filters.to === '' || day <= filters.to)
    );
  });
}

export interface OrderFilterOptions {
  readonly brokers: readonly { readonly id: string; readonly name: string }[];
  readonly markets: readonly string[];
  readonly statuses: readonly OrderStatusDto[];
  readonly strategies: readonly { readonly id: string; readonly name: string }[];
}

// Options come from the data, so no filter offers a choice that would show nothing.
export function orderFilterOptions(entries: readonly OrderHistoryEntryDto[]): OrderFilterOptions {
  const brokers = new Map<string, string>();
  const strategies = new Map<string, string>();
  entries.forEach((entry) => {
    brokers.set(entry.brokerId, entry.brokerName);
    if (entry.strategyId === null) {
      strategies.set(MANUAL, 'Placed by hand');
    } else {
      strategies.set(String(entry.strategyId), entry.strategyName ?? String(entry.strategyId));
    }
  });
  return {
    brokers: [...brokers].map(([id, name]) => ({ id, name })),
    markets: [...new Set(entries.map((entry) => entry.marketId))].sort(),
    statuses: [...new Set(entries.map((entry) => entry.status))],
    strategies: [...strategies].map(([id, name]) => ({ id, name })),
  };
}

export function isOrderFiltered(filters: OrderFilters): boolean {
  return (
    filters.broker !== ALL ||
    filters.market !== ALL ||
    filters.status !== ALL ||
    filters.strategy !== ALL ||
    filters.from !== '' ||
    filters.to !== ''
  );
}

export interface OrderCounts {
  readonly total: number;
  readonly unconfirmed: number;
  readonly working: number;
  readonly simulated: number;
}

export function orderCounts(entries: readonly OrderHistoryEntryDto[]): OrderCounts {
  return {
    total: entries.length,
    unconfirmed: entries.filter((entry) => entry.status === 'unconfirmed').length,
    working: entries.filter(
      (entry) => entry.status === 'pending' || entry.status === 'partially_filled',
    ).length,
    simulated: entries.filter((entry) => entry.isSimulated).length,
  };
}
