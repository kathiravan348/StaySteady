// Configuration server state for instrument types, currencies and alert rules (UI spec 7.18). Writes
// return the whole list, which replaces the cache (decision 33). The three areas share one shape, so
// the hooks are built from small helpers rather than written out three times.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { z } from 'zod';

import type {
  AlertRuleConfigEntryDto,
  AlertRuleConfigInput,
  BaseCurrencyConfigInput,
  BaseCurrencyEntryDto,
  ConnectionTestResultDto,
  CredentialConfigEntryDto,
  CredentialConfigInput,
  CurrencyConfigEntryDto,
  CurrencyConfigInput,
  InstrumentTypeConfigEntryDto,
  InstrumentTypeConfigInput,
} from '../schemas';
import {
  AlertRuleConfigListSchema,
  BaseCurrencyEntrySchema,
  ConnectionTestResultSchema,
  CredentialConfigListSchema,
  CurrencyConfigListSchema,
  InstrumentTypeConfigListSchema,
} from '../schemas';
import { apiGet, apiSend } from './apiClient';

export interface SaveConfigVariables<T> {
  readonly isNew: boolean;
  readonly id: string;
  readonly config: T;
  readonly reason: string;
}

export interface RevertConfigVariables {
  readonly id: string;
  readonly version: number;
  readonly reason: string;
}

export function useConfigList<S extends z.ZodType>(
  key: readonly string[],
  path: string,
  schema: S,
): UseQueryResult<z.output<S>> {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => apiGet(path, schema, signal) });
}

export function useConfigSave<S extends z.ZodType, T>(
  key: readonly string[],
  path: string,
  schema: S,
): UseMutationResult<z.output<S>, Error, SaveConfigVariables<T>> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ isNew, id, config, reason }: SaveConfigVariables<T>) =>
      isNew
        ? apiSend('POST', path, { config, reason }, schema)
        : apiSend('PUT', `${path}/${encodeURIComponent(id)}`, { config, reason }, schema),
    onSuccess: (data) => {
      client.setQueryData(key, data);
    },
  });
}

export function useConfigRevert<S extends z.ZodType>(
  key: readonly string[],
  path: string,
  schema: S,
): UseMutationResult<z.output<S>, Error, RevertConfigVariables> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: RevertConfigVariables) =>
      apiSend('POST', `${path}/${encodeURIComponent(id)}/revert`, { version, reason }, schema),
    onSuccess: (data) => {
      client.setQueryData(key, data);
    },
  });
}

const INSTRUMENTS = { key: ['config', 'instruments'], path: '/api/v1/config/instruments' } as const;
const CURRENCIES = { key: ['config', 'currencies'], path: '/api/v1/config/currencies' } as const;
const BASE = { key: ['config', 'base-currency'], path: '/api/v1/config/base-currency' } as const;
const CREDENTIALS = { key: ['config', 'credentials'], path: '/api/v1/config/credentials' } as const;
const ALERTS = { key: ['config', 'alerts'], path: '/api/v1/config/alerts' } as const;

export function useInstrumentTypeConfigs(): UseQueryResult<InstrumentTypeConfigEntryDto[]> {
  return useConfigList(INSTRUMENTS.key, INSTRUMENTS.path, InstrumentTypeConfigListSchema);
}

export function useSaveInstrumentTypeConfig(): UseMutationResult<
  InstrumentTypeConfigEntryDto[],
  Error,
  SaveConfigVariables<InstrumentTypeConfigInput>
> {
  return useConfigSave(INSTRUMENTS.key, INSTRUMENTS.path, InstrumentTypeConfigListSchema);
}

export function useRevertInstrumentTypeConfig(): UseMutationResult<
  InstrumentTypeConfigEntryDto[],
  Error,
  RevertConfigVariables
> {
  return useConfigRevert(INSTRUMENTS.key, INSTRUMENTS.path, InstrumentTypeConfigListSchema);
}

export function useCurrencyConfigs(): UseQueryResult<CurrencyConfigEntryDto[]> {
  return useConfigList(CURRENCIES.key, CURRENCIES.path, CurrencyConfigListSchema);
}

export function useSaveCurrencyConfig(): UseMutationResult<
  CurrencyConfigEntryDto[],
  Error,
  SaveConfigVariables<CurrencyConfigInput>
> {
  return useConfigSave(CURRENCIES.key, CURRENCIES.path, CurrencyConfigListSchema);
}

export function useRevertCurrencyConfig(): UseMutationResult<
  CurrencyConfigEntryDto[],
  Error,
  RevertConfigVariables
> {
  return useConfigRevert(CURRENCIES.key, CURRENCIES.path, CurrencyConfigListSchema);
}

export function useBaseCurrencyConfig(): UseQueryResult<BaseCurrencyEntryDto> {
  return useConfigList(BASE.key, BASE.path, BaseCurrencyEntrySchema);
}

// Changing the base currency changes every currency's health, so both caches refresh.
export function useSaveBaseCurrency(): UseMutationResult<
  BaseCurrencyEntryDto,
  Error,
  { readonly config: BaseCurrencyConfigInput; readonly reason: string }
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      readonly config: BaseCurrencyConfigInput;
      readonly reason: string;
    }) => apiSend('PUT', BASE.path, variables, BaseCurrencyEntrySchema),
    onSuccess: (data) => {
      client.setQueryData(BASE.key, data);
      void client.invalidateQueries({ queryKey: CURRENCIES.key });
    },
  });
}

export function useRevertBaseCurrency(): UseMutationResult<
  BaseCurrencyEntryDto,
  Error,
  Omit<RevertConfigVariables, 'id'>
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ version, reason }: Omit<RevertConfigVariables, 'id'>) =>
      apiSend('POST', `${BASE.path}/revert`, { version, reason }, BaseCurrencyEntrySchema),
    onSuccess: (data) => {
      client.setQueryData(BASE.key, data);
      void client.invalidateQueries({ queryKey: CURRENCIES.key });
    },
  });
}

export function useAlertRuleConfigs(): UseQueryResult<AlertRuleConfigEntryDto[]> {
  return useConfigList(ALERTS.key, ALERTS.path, AlertRuleConfigListSchema);
}

export function useSaveAlertRuleConfig(): UseMutationResult<
  AlertRuleConfigEntryDto[],
  Error,
  SaveConfigVariables<AlertRuleConfigInput>
> {
  return useConfigSave(ALERTS.key, ALERTS.path, AlertRuleConfigListSchema);
}

export function useRevertAlertRuleConfig(): UseMutationResult<
  AlertRuleConfigEntryDto[],
  Error,
  RevertConfigVariables
> {
  return useConfigRevert(ALERTS.key, ALERTS.path, AlertRuleConfigListSchema);
}

export function useCredentialConfigs(): UseQueryResult<CredentialConfigEntryDto[]> {
  return useConfigList(CREDENTIALS.key, CREDENTIALS.path, CredentialConfigListSchema);
}

export function useSaveCredentialConfig(): UseMutationResult<
  CredentialConfigEntryDto[],
  Error,
  SaveConfigVariables<CredentialConfigInput>
> {
  return useConfigSave(CREDENTIALS.key, CREDENTIALS.path, CredentialConfigListSchema);
}

export function useRevertCredentialConfig(): UseMutationResult<
  CredentialConfigEntryDto[],
  Error,
  RevertConfigVariables
> {
  return useConfigRevert(CREDENTIALS.key, CREDENTIALS.path, CredentialConfigListSchema);
}

// Sends nothing: the mock reports what each channel would do with a test alert.
export function useTestAlertRule(): UseMutationResult<
  ConnectionTestResultDto,
  Error,
  AlertRuleConfigInput
> {
  return useMutation({
    mutationFn: (config: AlertRuleConfigInput) =>
      apiSend('POST', `${ALERTS.path}/test`, { config }, ConnectionTestResultSchema),
  });
}
