// Classification, corporate structure and ownership (requirements 36; decisions 49, 51).
// One scheme covers every market: a company instrument carries a sector and an industry, an
// instrument with no company behind it carries an asset class instead, and a fund carries both a
// blend label and, later (R-03), the look-through of what it holds. A provider's own scheme is kept
// as a mapping rather than discarded, so a real provider can be reconciled against this one.

import { z } from 'zod';

import { InstrumentIdSchema, IsoDateSchema, MarketIdSchema, PercentageSchema } from './common';

// Bump only on a deliberate taxonomy change; consumers record which scheme classified a row.
export const CLASSIFICATION_SCHEME = 'staysteady-v1';

export const IndustrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type IndustryDto = z.infer<typeof IndustrySchema>;

export const SectorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  industries: z.array(IndustrySchema).min(1),
});
export type SectorDto = z.infer<typeof SectorSchema>;

// The shared list every consumer filters and groups by (allocation, limits, screener, peers).
export const ClassificationTaxonomySchema = z.object({
  scheme: z.literal(CLASSIFICATION_SCHEME),
  sectors: z.array(SectorSchema).min(1),
  assetClasses: z.array(z.string().min(1)).min(1),
  asOf: IsoDateSchema,
});
export type ClassificationTaxonomyDto = z.infer<typeof ClassificationTaxonomySchema>;

// company: a sector and an industry apply. fund: the holdings decide the exposure, so the fund's
// own label is a blend. asset_class: nothing company-like applies and saying so is the honest answer.
export const ClassificationKindSchema = z.enum(['company', 'fund', 'asset_class']);
export type ClassificationKind = z.infer<typeof ClassificationKindSchema>;

export const ProviderClassificationSchema = z.object({
  provider: z.string().min(1),
  scheme: z.string().min(1),
  sector: z.string().min(1),
  industry: z.string().min(1).nullable(),
});
export type ProviderClassificationDto = z.infer<typeof ProviderClassificationSchema>;

export const InstrumentClassificationSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    symbol: z.string().min(1),
    scheme: z.literal(CLASSIFICATION_SCHEME),
    kind: ClassificationKindSchema,
    sectorId: z.string().min(1).nullable(),
    sectorName: z.string().min(1).nullable(),
    industryId: z.string().min(1).nullable(),
    industryName: z.string().min(1).nullable(),
    // Set for every kind other than company: "Commodity", "Currency", "Digital asset" and so on.
    assetClass: z.string().min(1).nullable(),
    providerMappings: z.array(ProviderClassificationSchema),
    asOf: IsoDateSchema,
    source: z.string().min(1),
    // Why an instrument carries no sector, or what the fund's blend means. Never left empty.
    note: z.string().min(1),
  })
  .refine((value) => value.kind !== 'company' || value.sectorId !== null, {
    error: 'A company instrument must carry a sector',
    path: ['sectorId'],
  })
  .refine((value) => value.kind !== 'company' || value.industryId !== null, {
    error: 'A company instrument must carry an industry',
    path: ['industryId'],
  })
  .refine((value) => value.kind === 'company' || value.assetClass !== null, {
    error: 'An instrument with no company behind it must carry an asset class',
    path: ['assetClass'],
  });
export type InstrumentClassificationDto = z.infer<typeof InstrumentClassificationSchema>;

export const CompanyRelationSchema = z.enum(['parent', 'subsidiary', 'associate', 'group_company']);
export type CompanyRelation = z.infer<typeof CompanyRelationSchema>;

// A related company is listed elsewhere in the universe or not tracked at all; instrumentId is set
// only when this platform can price it, so a screen can link to what it has and name the rest.
export const RelatedCompanySchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1).nullable(),
  instrumentId: InstrumentIdSchema.nullable(),
  marketId: MarketIdSchema.nullable(),
  relation: CompanyRelationSchema,
  // Share of the related company held by the parent or group, where it is published.
  sharePercent: PercentageSchema.nullable(),
  isListed: z.boolean(),
});
export type RelatedCompanyDto = z.infer<typeof RelatedCompanySchema>;

export const CorporateStructureSchema = z.object({
  instrumentId: InstrumentIdSchema,
  companyName: z.string().min(1),
  // Null when the company is the top of its own structure, or has no company behind it at all.
  parent: RelatedCompanySchema.nullable(),
  groupId: z.string().min(1).nullable(),
  groupName: z.string().min(1).nullable(),
  // Material listed subsidiaries, associates and group companies, parent excluded.
  related: z.array(RelatedCompanySchema),
  asOf: IsoDateSchema,
  source: z.string().min(1),
  note: z.string().min(1),
});
export type CorporateStructureDto = z.infer<typeof CorporateStructureSchema>;

// One reported quarter. Promoter fields are null in markets that do not report a promoter or
// founder block, which is not the same as a promoter holding nothing.
export const OwnershipPointSchema = z
  .object({
    periodEnd: IsoDateSchema,
    promoterPercent: PercentageSchema.nullable(),
    foreignInstitutionalPercent: PercentageSchema,
    domesticInstitutionalPercent: PercentageSchema,
    publicPercent: PercentageSchema,
    // Share of the promoter's own holding that is pledged against borrowing. Rising is a warning.
    promoterPledgePercent: PercentageSchema.nullable(),
  })
  .refine(
    (value) => {
      const total =
        (value.promoterPercent ?? 0) +
        value.foreignInstitutionalPercent +
        value.domesticInstitutionalPercent +
        value.publicPercent;
      return Math.abs(total - 100) <= 0.1;
    },
    { error: 'Ownership percentages must add up to 100', path: ['publicPercent'] },
  )
  .refine((value) => value.promoterPledgePercent === null || value.promoterPercent !== null, {
    error: 'A pledge cannot be reported without a promoter holding',
    path: ['promoterPledgePercent'],
  });
export type OwnershipPointDto = z.infer<typeof OwnershipPointSchema>;

export const InstrumentOwnershipSchema = z.object({
  instrumentId: InstrumentIdSchema,
  // Oldest first, so a trend reads left to right without the consumer re-sorting.
  points: z.array(OwnershipPointSchema).min(1),
  reportsPromoterHolding: z.boolean(),
  asOf: IsoDateSchema,
  source: z.string().min(1),
  note: z.string().min(1),
});
export type InstrumentOwnershipDto = z.infer<typeof InstrumentOwnershipSchema>;

// A fund or a commodity having no shareholding pattern is a fact about the instrument, not a failed
// request, so the endpoint answers with the reason instead of an error the screen has to interpret.
export const InstrumentOwnershipResponseSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    ownership: InstrumentOwnershipSchema.nullable(),
    unavailableReason: z.string().min(1).nullable(),
  })
  .refine((value) => (value.ownership === null) !== (value.unavailableReason === null), {
    error: 'Either the ownership pattern or the reason it is unavailable, never both or neither',
    path: ['unavailableReason'],
  });
export type InstrumentOwnershipResponseDto = z.infer<typeof InstrumentOwnershipResponseSchema>;
