// System health, alerts and approvals server state.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type { AlertDto, ApprovalDto, SystemHealthResponseDto } from '../schemas';
import { AlertSchema, ApprovalSchema, SystemHealthResponseSchema } from '../schemas';
import { apiGet } from './apiClient';

const HEALTH_REFRESH_MS = 15_000;

const AlertListSchema = z.array(AlertSchema);
const ApprovalListSchema = z.array(ApprovalSchema);

export function useSystemHealth(): UseQueryResult<SystemHealthResponseDto> {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: ({ signal }) => apiGet('/api/v1/system/health', SystemHealthResponseSchema, signal),
    refetchInterval: HEALTH_REFRESH_MS,
  });
}

export function useAlerts(): UseQueryResult<AlertDto[]> {
  return useQuery({
    queryKey: ['system', 'alerts'],
    queryFn: ({ signal }) => apiGet('/api/v1/system/alerts', AlertListSchema, signal),
  });
}

export function useApprovals(): UseQueryResult<ApprovalDto[]> {
  return useQuery({
    queryKey: ['trading', 'approvals'],
    queryFn: ({ signal }) => apiGet('/api/v1/approvals', ApprovalListSchema, signal),
  });
}
