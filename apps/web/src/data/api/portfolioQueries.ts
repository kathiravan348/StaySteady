// Portfolio server state (UI spec 7.1, 7.2).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { HoldingDto, PortfolioSummaryDto } from '../schemas';
import { HoldingSchema, PortfolioSummarySchema } from '../schemas';
import { apiGet } from './apiClient';

const HoldingListSchema = z.array(HoldingSchema);

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
