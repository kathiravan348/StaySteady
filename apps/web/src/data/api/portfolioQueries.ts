// Portfolio server state (UI spec 7.1, 7.2).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { BrokerDto, HoldingDto, PortfolioSummaryDto } from '../schemas';
import { BrokerSchema, HoldingSchema, PortfolioSummarySchema } from '../schemas';
import { apiGet } from './apiClient';

const HoldingListSchema = z.array(HoldingSchema);
const BrokerListSchema = z.array(BrokerSchema);

export function useBrokers(): UseQueryResult<BrokerDto[]> {
  return useQuery({
    queryKey: ['brokers'],
    queryFn: ({ signal }) => apiGet('/api/v1/brokers', BrokerListSchema, signal),
    staleTime: 5 * 60_000,
  });
}

export function usePortfolioHoldings(): UseQueryResult<HoldingDto[]> {
  return useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: ({ signal }) => apiGet('/api/v1/portfolio/holdings', HoldingListSchema, signal),
  });
}

export function usePortfolioSummary(): UseQueryResult<PortfolioSummaryDto> {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: ({ signal }) => apiGet('/api/v1/portfolio/summary', PortfolioSummarySchema, signal),
  });
}
