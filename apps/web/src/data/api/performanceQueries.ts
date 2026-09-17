// Portfolio performance server state (nav map 6).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import type { PortfolioPerformanceDto, ReportCurrencyDto } from '../schemas';
import { PortfolioPerformanceSchema } from '../schemas';
import { apiGet } from './apiClient';

export function usePortfolioPerformance(
  currency: ReportCurrencyDto,
): UseQueryResult<PortfolioPerformanceDto> {
  return useQuery({
    queryKey: ['portfolio', 'performance', currency],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/portfolio/performance?currency=${currency}`,
        PortfolioPerformanceSchema,
        signal,
      ),
  });
}
