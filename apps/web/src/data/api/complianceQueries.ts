// TanStack Query server state hooks for Compliance (requirements 27; UI spec 19.1).
// Mutations update the query cache directly with the returned view (decisions 22 and 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  AddRestrictedInstrumentInput,
  ComplianceView,
  EligibilityCheckResult,
} from '../schemas/compliance';
import { ComplianceViewSchema, EligibilityCheckResultSchema } from '../schemas/compliance';
import { apiGet, apiSend } from './apiClient';

export const COMPLIANCE_KEY = ['compliance'] as const;

export function useCompliance(): UseQueryResult<ComplianceView> {
  return useQuery({
    queryKey: COMPLIANCE_KEY,
    queryFn: ({ signal }) => apiGet('/api/v1/compliance', ComplianceViewSchema, signal),
  });
}

export function useCheckEligibility(): UseMutationResult<
  EligibilityCheckResult,
  Error,
  { symbol: string; action: 'BUY' | 'SELL' }
> {
  return useMutation({
    mutationFn: (payload) =>
      apiSend('POST', '/api/v1/compliance/check', payload, EligibilityCheckResultSchema),
  });
}

export function useAddRestrictedInstrument(): UseMutationResult<
  ComplianceView,
  Error,
  AddRestrictedInstrumentInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AddRestrictedInstrumentInput) =>
      apiSend('POST', '/api/v1/compliance/restricted', input, ComplianceViewSchema),
    onSuccess: (updated) => {
      client.setQueryData(COMPLIANCE_KEY, updated);
    },
  });
}

export function useRemoveRestrictedInstrument(): UseMutationResult<ComplianceView, Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiSend(
        'DELETE',
        `/api/v1/compliance/restricted/${encodeURIComponent(id)}`,
        {},
        ComplianceViewSchema,
      ),
    onSuccess: (updated) => {
      client.setQueryData(COMPLIANCE_KEY, updated);
    },
  });
}

export function useConfirmPolicyReview(): UseMutationResult<ComplianceView, Error, void> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiSend('POST', '/api/v1/compliance/confirm-review', {}, ComplianceViewSchema),
    onSuccess: (updated) => {
      client.setQueryData(COMPLIANCE_KEY, updated);
    },
  });
}
