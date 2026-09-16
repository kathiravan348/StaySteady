// Risk and safety server state (UI spec 7.14). Every write returns the whole panel, which replaces
// the cache (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  EmergencyRequestDto,
  LimitChangeRequestDto,
  RiskBreachDto,
  RiskPanelDto,
} from '../schemas';
import { RiskBreachListSchema, RiskPanelSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const PANEL_KEY = ['risk', 'panel'] as const;

export function useRiskPanel(): UseQueryResult<RiskPanelDto> {
  return useQuery({
    queryKey: PANEL_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/risk/panel', RiskPanelSchema, signal),
  });
}

export function useRiskBreaches(): UseQueryResult<RiskBreachDto[]> {
  return useQuery({
    queryKey: ['risk', 'breaches'],
    queryFn: ({ signal }) => apiGet('/api/v1/risk/breaches', RiskBreachListSchema, signal),
  });
}

export interface ChangeRiskLimitVariables {
  readonly limitId: string;
  readonly request: LimitChangeRequestDto;
}

export function useChangeRiskLimit(): UseMutationResult<
  RiskPanelDto,
  Error,
  ChangeRiskLimitVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ limitId, request }: ChangeRiskLimitVariables) =>
      apiSend(
        'PATCH',
        `/api/v1/risk/limits/${encodeURIComponent(limitId)}`,
        request,
        RiskPanelSchema,
      ),
    onSuccess: (panel) => {
      client.setQueryData(PANEL_KEY, panel);
      void client.invalidateQueries({ queryKey: ['risk', 'breaches'] });
    },
  });
}

// An emergency cancel changes orders and approvals, so every screen that reads them refreshes.
export function useEmergencyAction(): UseMutationResult<RiskPanelDto, Error, EmergencyRequestDto> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: EmergencyRequestDto) =>
      apiSend('POST', '/api/v1/risk/emergency', request, RiskPanelSchema),
    onSuccess: (panel) => {
      client.setQueryData(PANEL_KEY, panel);
      void client.invalidateQueries({ queryKey: ['risk', 'breaches'] });
      void client.invalidateQueries({ queryKey: ['orders'] });
      void client.invalidateQueries({ queryKey: ['approvals'] });
      void client.invalidateQueries({ queryKey: ['trading', 'approvals'] });
    },
  });
}
