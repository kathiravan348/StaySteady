// Instrument classification generator (R-01; requirements 36; decision 49). One source of sector
// and industry for every consumer: fundamentals, allocation, limits, the screener and peer groups.

import type { z } from 'zod';

import type { InstrumentDto } from '../../schemas';
import type {
  ClassificationTaxonomyDto,
  InstrumentClassificationDto,
} from '../../schemas/classification';
import {
  CLASSIFICATION_SCHEME,
  ClassificationTaxonomySchema,
  InstrumentClassificationSchema,
} from '../../schemas/classification';
import {
  ASSET_CLASS_BY_SYMBOL,
  assetClassForType,
  INDUSTRY_BY_SYMBOL,
  PROVIDER_MAPPINGS_BY_SYMBOL,
} from './classificationAssignments';
import { ASSET_CLASSES, placementForIndustry, TAXONOMY_SECTORS } from './classificationTaxonomy';
import { getInstrumentById } from './canonicalInstruments';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

const SOURCE = 'StaySteady classification (mock)';
const FUND_TYPES = new Set<InstrumentDto['type']>(['etf', 'mutual_fund']);

function asOfDate(ctx: MockGeneratorContext): string {
  return String(ctx.referenceTime).slice(0, 10);
}

export function generateClassificationTaxonomy(
  ctx: MockGeneratorContext,
): ClassificationTaxonomyDto {
  return parseGenerated(
    ClassificationTaxonomySchema,
    {
      scheme: CLASSIFICATION_SCHEME,
      sectors: TAXONOMY_SECTORS.map((sector) => ({
        id: sector.id,
        name: sector.name,
        industries: sector.industries.map((industry) => ({ id: industry.id, name: industry.name })),
      })),
      assetClasses: [...ASSET_CLASSES],
      asOf: asOfDate(ctx),
    },
    'classification taxonomy',
  );
}

export function classificationForInstrument(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): InstrumentClassificationDto {
  const { symbol } = instrument;
  const industryName = INDUSTRY_BY_SYMBOL[symbol];
  const base = {
    instrumentId: String(instrument.id),
    symbol,
    scheme: CLASSIFICATION_SCHEME,
    providerMappings: [...(PROVIDER_MAPPINGS_BY_SYMBOL[symbol] ?? [])],
    asOf: asOfDate(ctx),
    source: SOURCE,
  } satisfies Omit<
    z.input<typeof InstrumentClassificationSchema>,
    'kind' | 'sectorId' | 'sectorName' | 'industryId' | 'industryName' | 'assetClass' | 'note'
  >;

  if (industryName !== undefined) {
    const { sector, industry } = placementForIndustry(industryName);
    return parseGenerated(
      InstrumentClassificationSchema,
      {
        ...base,
        kind: 'company' as const,
        sectorId: sector.id,
        sectorName: sector.name,
        industryId: industry.id,
        industryName: industry.name,
        assetClass: null,
        note:
          base.providerMappings.length > 0
            ? `Classified as ${sector.name} / ${industry.name}, mapped to the provider's own scheme.`
            : `Classified as ${sector.name} / ${industry.name}. No provider mapping supplied for this instrument yet.`,
      },
      'instrument classification',
    );
  }

  const assetClass = ASSET_CLASS_BY_SYMBOL[symbol] ?? assetClassForType(instrument.type);
  const isFund = FUND_TYPES.has(instrument.type);
  const note =
    assetClass === null
      ? 'No classification recorded for this instrument yet; limits and allocation by sector cannot include it until one is.'
      : isFund
        ? `${assetClass}: the fund's own label is a blend, and its real sector exposure comes from looking through to what it holds.`
        : `${assetClass}: no company sits behind this instrument, so sector and industry do not apply.`;

  return parseGenerated(
    InstrumentClassificationSchema,
    {
      ...base,
      kind: (isFund ? 'fund' : 'asset_class') as 'fund' | 'asset_class',
      sectorId: null,
      sectorName: null,
      industryId: null,
      industryName: null,
      assetClass,
      note,
    },
    'instrument classification',
  );
}

export function generateInstrumentClassification(
  ctx: MockGeneratorContext,
  instrumentId: string,
): InstrumentClassificationDto | null {
  const instrument = getInstrumentById(instrumentId);
  return instrument === undefined ? null : classificationForInstrument(ctx, instrument);
}

// The label a list or filter shows for a symbol: the sector for a company, the asset class
// otherwise. Used by the screener so its rows carry taxonomy names, not free text.
export function classificationLabelForSymbol(symbol: string, fallback: string): string {
  const industryName = INDUSTRY_BY_SYMBOL[symbol];
  if (industryName !== undefined) return placementForIndustry(industryName).sector.name;
  return ASSET_CLASS_BY_SYMBOL[symbol] ?? fallback;
}

// The sector of the company behind a symbol, or null when no company sits behind it.
export function sectorNameForSymbol(symbol: string): string | null {
  const industryName = INDUSTRY_BY_SYMBOL[symbol];
  return industryName === undefined ? null : placementForIndustry(industryName).sector.name;
}

export function industryLabelForSymbol(symbol: string): string | null {
  const industryName = INDUSTRY_BY_SYMBOL[symbol];
  return industryName === undefined ? null : placementForIndustry(industryName).industry.name;
}

// Peer group for comparison (R-06, R-09): every symbol in the same industry, itself excluded.
export function peerSymbolsForSymbol(symbol: string): readonly string[] {
  const industryName = INDUSTRY_BY_SYMBOL[symbol];
  if (industryName === undefined) return [];
  return Object.entries(INDUSTRY_BY_SYMBOL)
    .filter(([peer, industry]) => industry === industryName && peer !== symbol)
    .map(([peer]) => peer);
}
