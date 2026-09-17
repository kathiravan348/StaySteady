// Which tax rule applies to a holding (requirements 26; decision 45). Pure, shared by the screens and
// the mock server: tax follows the residence country's rule set, and an instrument listed outside
// that country is foreign.

import type {
  AssetClassTaxRuleInput,
  InstrumentTypeDto,
  TaxAssetClassDto,
  TaxRuleSetConfigInput,
} from '../../data/schemas';

export interface TaxableInstrument {
  readonly type: InstrumentTypeDto;
  readonly marketId: string;
  readonly symbol: string;
}

const GOLD = /^(XAU|GOLD|GLD|SGB)/;

export function taxAssetClassOf(
  instrument: TaxableInstrument,
  residenceCountry: string,
): TaxAssetClassDto {
  const isDomestic = instrument.marketId === residenceCountry;
  if (instrument.type === 'bond') return 'debt';
  if (instrument.type === 'commodity') return GOLD.test(instrument.symbol) ? 'gold' : 'other';
  if (instrument.type === 'mutual_fund' || instrument.type === 'etf') {
    return isDomestic ? 'domestic_equity_fund' : 'foreign_equity';
  }
  if (
    instrument.type === 'long_term' ||
    instrument.type === 'swing' ||
    instrument.type === 'intraday' ||
    instrument.type === 'ipo'
  ) {
    return isDomestic ? 'domestic_equity' : 'foreign_equity';
  }
  return 'other';
}

// The residence rule set, if one is configured.
export function residenceRules(
  sets: readonly TaxRuleSetConfigInput[],
): TaxRuleSetConfigInput | null {
  return sets.find((set) => set.isResidence) ?? null;
}

export function taxRuleFor(
  set: TaxRuleSetConfigInput | null,
  instrument: TaxableInstrument,
): AssetClassTaxRuleInput | null {
  if (set === null) return null;
  const assetClass = taxAssetClassOf(instrument, set.country);
  return (
    set.rules.find((rule) => rule.assetClass === assetClass) ??
    set.rules.find((rule) => rule.assetClass === 'other') ??
    null
  );
}

export const TAX_ASSET_CLASS_LABEL: Readonly<Record<TaxAssetClassDto, string>> = {
  domestic_equity: 'Listed shares at home',
  domestic_equity_fund: 'Equity funds and ETFs at home',
  foreign_equity: 'Foreign shares and funds',
  debt: 'Bonds and debt funds',
  gold: 'Gold',
  other: 'Everything else',
};
