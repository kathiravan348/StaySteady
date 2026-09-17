// Classification, corporate structure and ownership server state (R-01; decision 22).

import { useQuery } from '@tanstack/react-query';
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

export function useCorporateStructure(instrumentId: string): UseQueryResult<CorporateStructureDto> {
  return useQuery({
    queryKey: ['classification', 'structure', instrumentId],
    queryFn: ({ signal }) =>
      apiGet(instrumentPath(instrumentId, 'structure'), CorporateStructureSchema, signal),
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
