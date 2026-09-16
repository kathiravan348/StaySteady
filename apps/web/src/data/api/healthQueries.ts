// System Health server state (UI spec 7.15). Live checks refresh on their own; each panel owns its
// query so one failing source never blanks the whole screen.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  AlertChannelDto,
  ComponentHealthDto,
  DataFreshnessDto,
  IncidentDto,
  ReliabilityPeriodDto,
  SourceReliabilityDto,
} from '../schemas';
import {
  AlertChannelListSchema,
  ComponentHealthSchema,
  DataFreshnessSchema,
  IncidentSchema,
  SourceReliabilitySchema,
} from '../schemas';
import { apiGet, apiSend } from './apiClient';

const LIVE_REFRESH_MS = 15_000;
const ALERT_CHANNELS_KEY = ['health', 'alert-channels'] as const;

export function useComponentHealth(): UseQueryResult<ComponentHealthDto[]> {
  return useQuery({
    queryKey: ['health', 'components'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/system/components', z.array(ComponentHealthSchema), signal),
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useDataFreshness(): UseQueryResult<DataFreshnessDto[]> {
  return useQuery({
    queryKey: ['health', 'freshness'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/system/freshness', z.array(DataFreshnessSchema), signal),
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useSourceReliability(
  period: ReliabilityPeriodDto,
): UseQueryResult<SourceReliabilityDto[]> {
  return useQuery({
    queryKey: ['health', 'reliability', period],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/system/reliability?period=${period}`,
        z.array(SourceReliabilitySchema),
        signal,
      ),
  });
}

export function useIncidents(): UseQueryResult<IncidentDto[]> {
  return useQuery({
    queryKey: ['health', 'incidents'],
    queryFn: ({ signal }) => apiGet('/api/v1/system/incidents', z.array(IncidentSchema), signal),
  });
}

export function useAlertChannels(): UseQueryResult<AlertChannelDto[]> {
  return useQuery({
    queryKey: ALERT_CHANNELS_KEY,
    queryFn: ({ signal }) =>
      apiGet('/api/v1/system/alert-channels', AlertChannelListSchema, signal),
  });
}

// Sends a test message through one channel; the response carries every channel's latest result.
export function useTestAlertChannel(): UseMutationResult<AlertChannelDto[], Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      apiSend(
        'POST',
        `/api/v1/system/alert-channels/${encodeURIComponent(channelId)}/test`,
        undefined,
        AlertChannelListSchema,
      ),
    onSuccess: (channels) => {
      client.setQueryData(ALERT_CHANNELS_KEY, channels);
    },
  });
}
