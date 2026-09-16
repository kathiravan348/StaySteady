// Audit log server state (UI spec 7.20).

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import type { AuditEntryDto } from '../schemas';
import { AuditEntryListSchema } from '../schemas';
import { apiGet } from './apiClient';

export function useAuditLog(): UseQueryResult<AuditEntryDto[]> {
  return useQuery({
    queryKey: ['audit'],
    queryFn: ({ signal }) => apiGet('/api/v1/audit', AuditEntryListSchema, signal),
  });
}
