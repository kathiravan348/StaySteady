// Read-only reference data for Requirements Part II (M-17; UI spec 19.4): inflation history, capital
// losses carried forward, counterparty profiles and strategy lifecycles (decision 22).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import type { CounterpartiesDto } from '../schemas/counterparties';
import { CounterpartiesSchema } from '../schemas/counterparties';
import type { InflationHistoryDto } from '../schemas/inflation';
import { InflationHistorySchema } from '../schemas/inflation';
import type { StrategyLifecycleListDto } from '../schemas/strategy-lifecycle';
import { StrategyLifecycleListSchema } from '../schemas/strategy-lifecycle';
import type { LossCarryForwardListDto } from '../schemas/tax-losses';
import { LossCarryForwardListSchema } from '../schemas/tax-losses';
import { apiGet } from './apiClient';

export function useInflationHistory(): UseQueryResult<InflationHistoryDto> {
  return useQuery({
    queryKey: ['reference', 'inflation'],
    queryFn: ({ signal }) => apiGet('/api/v1/reference/inflation', InflationHistorySchema, signal),
  });
}

export function useLossCarryForwards(): UseQueryResult<LossCarryForwardListDto> {
  return useQuery({
    queryKey: ['tax', 'loss-carry-forwards'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/tax/loss-carry-forwards', LossCarryForwardListSchema, signal),
  });
}

export function useCounterparties(): UseQueryResult<CounterpartiesDto> {
  return useQuery({
    queryKey: ['counterparties'],
    queryFn: ({ signal }) => apiGet('/api/v1/counterparties', CounterpartiesSchema, signal),
  });
}

export function useStrategyLifecycles(): UseQueryResult<StrategyLifecycleListDto> {
  return useQuery({
    queryKey: ['strategies', 'lifecycle'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/strategies/lifecycle', StrategyLifecycleListSchema, signal),
  });
}
