// Net worth server state (requirements 25; UI spec 19.1). Writes return the whole view, which
// replaces the cache for that currency; other currencies refetch (decision 33).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  ManualAssetFieldsInput,
  NetWorthViewDto,
  RecordValuationRequestDto,
  ReportCurrencyDto,
} from '../schemas';
import { NetWorthViewSchema } from '../schemas';
import { apiGet, apiSend } from './apiClient';

const key = (currency: ReportCurrencyDto): readonly string[] => ['net-worth', currency];

export function useNetWorth(currency: ReportCurrencyDto): UseQueryResult<NetWorthViewDto> {
  return useQuery({
    queryKey: key(currency),
    queryFn: ({ signal }) =>
      apiGet(`/api/v1/net-worth?currency=${currency}`, NetWorthViewSchema, signal),
  });
}

function useNetWorthWrite<T>(
  currency: ReportCurrencyDto,
  send: (variables: T) => Promise<NetWorthViewDto>,
): UseMutationResult<NetWorthViewDto, Error, T> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: send,
    onSuccess: (view) => {
      client.setQueryData(key(currency), view);
      void client.invalidateQueries({
        queryKey: ['net-worth'],
        predicate: (query) => query.queryKey[1] !== currency,
      });
    },
  });
}

export function useAddManualAsset(
  currency: ReportCurrencyDto,
): UseMutationResult<NetWorthViewDto, Error, ManualAssetFieldsInput> {
  return useNetWorthWrite(currency, (asset: ManualAssetFieldsInput) =>
    apiSend('POST', `/api/v1/net-worth/assets?currency=${currency}`, asset, NetWorthViewSchema),
  );
}

export interface RecordValuationVariables {
  readonly id: string;
  readonly valuation: RecordValuationRequestDto;
}

export function useRecordValuation(
  currency: ReportCurrencyDto,
): UseMutationResult<NetWorthViewDto, Error, RecordValuationVariables> {
  return useNetWorthWrite(currency, ({ id, valuation }: RecordValuationVariables) =>
    apiSend(
      'PUT',
      `/api/v1/net-worth/assets/${encodeURIComponent(id)}/valuation?currency=${currency}`,
      valuation,
      NetWorthViewSchema,
    ),
  );
}
