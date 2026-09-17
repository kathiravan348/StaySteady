// Tax rule set configuration (E-09; decision 45). Writes return the whole list (decision 33). A save
// changes tax estimates in reports, so cached reports are refreshed; holdings read this list itself.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { TaxRuleSetConfigInput, TaxRuleSetEntryDto } from '../schemas';
import { TaxRuleSetListSchema } from '../schemas';
import { apiSend } from './apiClient';
import type { RevertConfigVariables, SaveConfigVariables } from './settingsConfigQueries';
import { useConfigList } from './settingsConfigQueries';

const KEY = ['config', 'tax-rules'] as const;
const PATH = '/api/v1/config/tax-rules';

export function useTaxRuleSets(): UseQueryResult<TaxRuleSetEntryDto[]> {
  return useConfigList(KEY, PATH, TaxRuleSetListSchema);
}

export function useSaveTaxRuleSet(): UseMutationResult<
  TaxRuleSetEntryDto[],
  Error,
  SaveConfigVariables<TaxRuleSetConfigInput>
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config, reason }: SaveConfigVariables<TaxRuleSetConfigInput>) =>
      apiSend('PUT', `${PATH}/${encodeURIComponent(id)}`, { config, reason }, TaxRuleSetListSchema),
    onSuccess: (data) => {
      client.setQueryData(KEY, data);
      void client.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useRevertTaxRuleSet(): UseMutationResult<
  TaxRuleSetEntryDto[],
  Error,
  RevertConfigVariables
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: RevertConfigVariables) =>
      apiSend(
        'POST',
        `${PATH}/${encodeURIComponent(id)}/revert`,
        { version, reason },
        TaxRuleSetListSchema,
      ),
    onSuccess: (data) => {
      client.setQueryData(KEY, data);
      void client.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
