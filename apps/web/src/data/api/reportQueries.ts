// Reports server state (UI spec 7.16): on-demand reports, scheduled reports and their run history.
// Schedule writes return the whole schedule list, which replaces the cache (decision 33).

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  CreateScheduledReportDto,
  ReportComparisonDto,
  ReportCurrencyDto,
  ReportDto,
  ReportRunDto,
  ReportTypeDto,
  ScheduledReportDto,
} from '../schemas';
import { ReportRunListSchema, ReportSchema, ScheduledReportListSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

export interface ReportRequestVariables {
  readonly type: ReportTypeDto;
  readonly from: string;
  readonly to: string;
  readonly currency: ReportCurrencyDto;
  readonly comparison: ReportComparisonDto;
}

const SCHEDULES_KEY = ['reports', 'schedules'] as const;
const RUNS_KEY = ['reports', 'runs'] as const;

// The previous report stays on screen while a changed request loads (isPlaceholderData).
export function useReport(request: ReportRequestVariables | null): UseQueryResult<ReportDto> {
  const search =
    request === null
      ? ''
      : new URLSearchParams({
          type: request.type,
          from: request.from,
          to: request.to,
          currency: request.currency,
          comparison: request.comparison,
        }).toString();
  return useQuery({
    queryKey: ['reports', 'report', search],
    queryFn: ({ signal }) => apiGet(`/api/v1/reports?${search}`, ReportSchema, signal),
    enabled: request !== null,
    placeholderData: keepPreviousData,
  });
}

export function useReportSchedules(): UseQueryResult<ScheduledReportDto[]> {
  return useQuery({
    queryKey: SCHEDULES_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/reports/schedules', ScheduledReportListSchema, signal),
  });
}

export function useReportRuns(): UseQueryResult<ReportRunDto[]> {
  return useQuery({
    queryKey: RUNS_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/reports/runs', ReportRunListSchema, signal),
  });
}

export type ScheduleAction =
  | { readonly kind: 'create'; readonly schedule: CreateScheduledReportDto }
  | { readonly kind: 'toggle'; readonly id: string; readonly enabled: boolean }
  | { readonly kind: 'delete'; readonly id: string }
  | { readonly kind: 'run'; readonly id: string };

export function useScheduleAction(): UseMutationResult<
  ScheduledReportDto[],
  Error,
  ScheduleAction
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: ScheduleAction) => {
      const base = '/api/v1/reports/schedules';
      switch (action.kind) {
        case 'create':
          return apiSend('POST', base, action.schedule, ScheduledReportListSchema);
        case 'toggle':
          return apiSend(
            'PATCH',
            `${base}/${encodeURIComponent(action.id)}`,
            { enabled: action.enabled },
            ScheduledReportListSchema,
          );
        case 'delete':
          return apiSend(
            'DELETE',
            `${base}/${encodeURIComponent(action.id)}`,
            undefined,
            ScheduledReportListSchema,
          );
        case 'run':
          return apiSend(
            'POST',
            `${base}/${encodeURIComponent(action.id)}/run`,
            undefined,
            ScheduledReportListSchema,
          );
      }
    },
    onSuccess: (schedules, action) => {
      client.setQueryData(SCHEDULES_KEY, schedules);
      if (action.kind === 'run') void client.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });
}
