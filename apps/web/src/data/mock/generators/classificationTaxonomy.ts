// The one sector and industry taxonomy (decision 49). Two levels, applied to every market, with
// stable slug ids so a saved filter or an allocation target survives a name change.

const SECTOR_DEFINITIONS: readonly (readonly [string, readonly string[]])[] = [
  [
    'Information technology',
    ['Software and services', 'Semiconductors', 'Technology hardware', 'IT services'],
  ],
  ['Communication services', ['Interactive media', 'Telecommunication services', 'Entertainment']],
  [
    'Consumer discretionary',
    ['Automobiles', 'Retail and internet commerce', 'Hotels, restaurants and leisure'],
  ],
  ['Consumer staples', ['Food and beverages', 'Household products', 'Food retail']],
  ['Health care', ['Pharmaceuticals', 'Biotechnology', 'Medical devices', 'Health care services']],
  ['Financials', ['Banks', 'Diversified financials', 'Insurance', 'Payments']],
  ['Energy', ['Oil, gas and consumable fuels', 'Refining and marketing', 'Renewable energy']],
  ['Industrials', ['Capital goods', 'Transport and logistics', 'Commercial services']],
  ['Materials', ['Metals and mining', 'Chemicals', 'Construction materials']],
  ['Utilities', ['Electric utilities', 'Water and gas utilities']],
  ['Real estate', ['Real estate operations', 'Real estate investment trusts']],
];

// Asset classes for instruments with no company behind them (requirements 36).
export const ASSET_CLASSES: readonly string[] = [
  'Broad market fund',
  'Sector fund',
  'Commodity',
  'Currency',
  'Digital asset',
  'Sovereign fixed income',
  'Corporate fixed income',
  'Private credit',
  'Equity derivative',
];

export interface TaxonomyIndustry {
  readonly id: string;
  readonly name: string;
}

export interface TaxonomySector {
  readonly id: string;
  readonly name: string;
  readonly industries: readonly TaxonomyIndustry[];
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const TAXONOMY_SECTORS: readonly TaxonomySector[] = SECTOR_DEFINITIONS.map(
  ([sector, industries]) => ({
    id: `sec-${slug(sector)}`,
    name: sector,
    industries: industries.map((industry) => ({ id: `ind-${slug(industry)}`, name: industry })),
  }),
);

export interface IndustryPlacement {
  readonly sector: TaxonomySector;
  readonly industry: TaxonomyIndustry;
}

const PLACEMENT_BY_INDUSTRY: ReadonlyMap<string, IndustryPlacement> = new Map(
  TAXONOMY_SECTORS.flatMap((sector) =>
    sector.industries.map((industry): readonly [string, IndustryPlacement] => [
      industry.name,
      { sector, industry },
    ]),
  ),
);

// An unknown industry name is a programming error in the assignment table, not bad input, so it
// throws rather than silently producing an unclassified instrument.
export function placementForIndustry(industryName: string): IndustryPlacement {
  const placement = PLACEMENT_BY_INDUSTRY.get(industryName);
  if (placement === undefined) {
    throw new Error(`Industry "${industryName}" is not in the classification taxonomy`);
  }
  return placement;
}

export function isKnownAssetClass(assetClass: string): boolean {
  return ASSET_CLASSES.includes(assetClass);
}
