// Classification, corporate structure and ownership server state (R-01; decision 22).

import { useQueries, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import type {
  ClassificationIndexDto,
  ClassificationTaxonomyDto,
  CorporateStructureDto,
  InstrumentClassificationDto,
  InstrumentOwnershipResponseDto,
} from '../schemas/classification';
import {
  ClassificationIndexSchema,
  ClassificationTaxonomySchema,
  CorporateStructureSchema,
  InstrumentClassificationSchema,
  InstrumentOwnershipResponseSchema,
} from '../schemas/classification';
import type { CompanyProfileResponseDto } from '../schemas/company-research';
import { CompanyProfileResponseSchema } from '../schemas/company-research';
import type { FinancialStatementsResponseDto } from '../schemas/financial-statements';
import { FinancialStatementsResponseSchema } from '../schemas/financial-statements';
import type {
  FundamentalMeasuresDto,
  FundamentalMeasuresResponseDto,
} from '../schemas/fundamental-measures';
import { FundamentalMeasuresResponseSchema } from '../schemas/fundamental-measures';
import type { FundLookThroughResponseDto } from '../schemas/fund-lookthrough';
import { FundLookThroughResponseSchema } from '../schemas/fund-lookthrough';
import { apiGet } from './apiClient';

// Classification changes rarely: a company moves industry, or a provider mapping is added.
const SLOW_STALE_MS = 5 * 60_000;

const instrumentPath = (instrumentId: string, suffix: string): string =>
  `/api/v1/instruments/${encodeURIComponent(instrumentId)}/${suffix}`;

export function useClassificationTaxonomy(): UseQueryResult<ClassificationTaxonomyDto> {
  return useQuery({
    queryKey: ['classification', 'taxonomy'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/classification/taxonomy', ClassificationTaxonomySchema, signal),
    staleTime: SLOW_STALE_MS,
  });
}

export function useClassificationIndex(): UseQueryResult<ClassificationIndexDto> {
  return useQuery({
    queryKey: ['classification', 'index'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/classification/instruments', ClassificationIndexSchema, signal),
    staleTime: SLOW_STALE_MS,
  });
}

export function useInstrumentClassification(
  instrumentId: string,
): UseQueryResult<InstrumentClassificationDto> {
  return useQuery({
    queryKey: ['classification', 'instrument', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(
        instrumentPath(instrumentId, 'classification'),
        InstrumentClassificationSchema,
        signal,
      ),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export function useCompanyProfile(instrumentId: string): UseQueryResult<CompanyProfileResponseDto> {
  return useQuery({
    queryKey: ['classification', 'company', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(instrumentPath(instrumentId, 'company'), CompanyProfileResponseSchema, signal),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export function useFinancialStatements(
  instrumentId: string,
): UseQueryResult<FinancialStatementsResponseDto> {
  return useQuery({
    queryKey: ['classification', 'statements', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(instrumentPath(instrumentId, 'statements'), FinancialStatementsResponseSchema, signal),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export function useFundamentalMeasures(
  instrumentId: string,
  basis: 'consolidated' | 'standalone' = 'consolidated',
): UseQueryResult<FundamentalMeasuresResponseDto> {
  return useQuery({
    queryKey: ['classification', 'measures', instrumentId, basis],
    queryFn: ({ signal }) =>
      apiGet(
        `${instrumentPath(instrumentId, 'measures')}?basis=${basis}`,
        FundamentalMeasuresResponseSchema,
        signal,
      ),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export interface PeerMeasuresResult {
  // Peers that have measures, in the order asked for. A peer without statements is left out.
  readonly peers: readonly FundamentalMeasuresDto[];
  readonly isPending: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
}

// The same measures for several peers at once, sharing the cache with useFundamentalMeasures.
export function usePeerFundamentalMeasures(
  instrumentIds: readonly string[],
  basis: 'consolidated' | 'standalone' = 'consolidated',
): PeerMeasuresResult {
  const results = useQueries({
    queries: instrumentIds.map((id) => ({
      queryKey: ['classification', 'measures', id, basis],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        apiGet(
          `${instrumentPath(id, 'measures')}?basis=${basis}`,
          FundamentalMeasuresResponseSchema,
          signal,
        ),
      staleTime: SLOW_STALE_MS,
    })),
  });
  return {
    peers: results.flatMap((result) =>
      result.data?.measures === null || result.data?.measures === undefined
        ? []
        : [result.data.measures],
    ),
    isPending: results.some((result) => result.isPending),
    error: results.find((result) => result.error !== null)?.error ?? null,
    refetch: () => {
      results.forEach((result) => {
        void result.refetch();
      });
    },
  };
}

export function useCorporateStructure(instrumentId: string): UseQueryResult<CorporateStructureDto> {
  return useQuery({
    queryKey: ['classification', 'structure', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(instrumentPath(instrumentId, 'structure'), CorporateStructureSchema, signal),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export function useFundLookThrough(
  instrumentId: string,
): UseQueryResult<FundLookThroughResponseDto> {
  return useQuery({
    queryKey: ['classification', 'look-through', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(instrumentPath(instrumentId, 'look-through'), FundLookThroughResponseSchema, signal),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}

export function useInstrumentOwnership(
  instrumentId: string,
): UseQueryResult<InstrumentOwnershipResponseDto> {
  return useQuery({
    queryKey: ['classification', 'ownership', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(instrumentPath(instrumentId, 'ownership'), InstrumentOwnershipResponseSchema, signal),
    enabled: instrumentId !== '',
    staleTime: SLOW_STALE_MS,
  });
}
