// Planning assumptions and operating policy configuration (E-09; UI spec 7.18). Writes return the
// whole list, which replaces the cache (decision 33); built on the shared configuration helpers.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  InflationAssumptionConfigInput,
  InflationAssumptionEntryDto,
  OperatingPolicyConfigInput,
  OperatingPolicyEntryDto,
} from '../schemas/config-assumptions';
import {
  InflationAssumptionListSchema,
  OperatingPolicyListSchema,
} from '../schemas/config-assumptions';
import type { RevertConfigVariables, SaveConfigVariables } from './settingsConfigQueries';
import { apiSend } from './apiClient';
import { useConfigList, useConfigRevert, useConfigSave } from './settingsConfigQueries';

const INFLATION = {
  key: ['config', 'inflation-assumptions'],
  path: '/api/v1/config/inflation-assumptions',
} as const;
const OPERATING = {
  key: ['config', 'operating-policy'],
  path: '/api/v1/config/operating-policy',
} as const;

export function useInflationAssumptions(): UseQueryResult<InflationAssumptionEntryDto[]> {
  return useConfigList(INFLATION.key, INFLATION.path, InflationAssumptionListSchema);
}

export function useSaveInflationAssumption(): UseMutationResult<
  InflationAssumptionEntryDto[],
  Error,
  SaveConfigVariables<InflationAssumptionConfigInput>
> {
  return useConfigSave(INFLATION.key, INFLATION.path, InflationAssumptionListSchema);
}

export function useRevertInflationAssumption(): UseMutationResult<
  InflationAssumptionEntryDto[],
  Error,
  RevertConfigVariables
> {
  return useConfigRevert(INFLATION.key, INFLATION.path, InflationAssumptionListSchema);
}

export function useOperatingPolicy(): UseQueryResult<OperatingPolicyEntryDto[]> {
  return useConfigList(OPERATING.key, OPERATING.path, OperatingPolicyListSchema);
}

// Saving the policy also changes the counterparty threshold the counterparties endpoint reports.
export function useSaveOperatingPolicy(): UseMutationResult<
  OperatingPolicyEntryDto[],
  Error,
  SaveConfigVariables<OperatingPolicyConfigInput>
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config, reason }: SaveConfigVariables<OperatingPolicyConfigInput>) =>
      apiSend(
        'PUT',
        `${OPERATING.path}/${encodeURIComponent(id)}`,
        { config, reason },
        OperatingPolicyListSchema,
      ),
    onSuccess: (data) => {
      client.setQueryData(OPERATING.key, data);
      void client.invalidateQueries({ queryKey: ['risk', 'counterparty-exposure'] });
      void client.invalidateQueries({ queryKey: ['counterparties'] });
      void client.invalidateQueries({ queryKey: ['approvals', 'queue'] });
    },
  });
}

export function useRevertOperatingPolicy(): UseMutationResult<
  OperatingPolicyEntryDto[],
  Error,
  RevertConfigVariables
> {
  return useConfigRevert(OPERATING.key, OPERATING.path, OperatingPolicyListSchema);
}
