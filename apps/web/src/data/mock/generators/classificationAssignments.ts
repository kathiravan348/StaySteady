// Which sector and industry each instrument sits in, and the provider scheme it maps to where a
// provider supplies one (requirements 36; decision 49). Keyed by symbol so canonical instruments
// and the wider screener universe classify from the same table and cannot disagree.

import type { InstrumentTypeDto } from '../../schemas';
import type { ProviderClassificationDto } from '../../schemas/classification';

// Industry names must exist in the taxonomy; placementForIndustry throws if one does not.
export const INDUSTRY_BY_SYMBOL: Readonly<Record<string, string>> = {
  AAPL: 'Technology hardware',
  MSFT: 'Software and services',
  NVDA: 'Semiconductors',
  GOOGL: 'Interactive media',
  TSLA: 'Automobiles',
  'BRK.B': 'Diversified financials',
  JNJ: 'Pharmaceuticals',
  JPM: 'Banks',
  V: 'Payments',
  AZN: 'Pharmaceuticals',
  '7203': 'Automobiles',
  D05: 'Banks',
  RELIANCE: 'Oil, gas and consumable fuels',
  TATAMOTORS: 'Automobiles',
  TCS: 'IT services',
  HDFCBANK: 'Banks',
  INFY: 'IT services',
  SWIGGY: 'Retail and internet commerce',
};

// Funds and instruments with no company behind them. A fund's label is a blend; the real exposure
// comes from looking through to its holdings (R-03).
export const ASSET_CLASS_BY_SYMBOL: Readonly<Record<string, string>> = {
  SPY: 'Broad market fund',
  VTSAX: 'Broad market fund',
  QQQ: 'Sector fund',
  NIFTYBEES: 'Broad market fund',
  XAUUSD: 'Commodity',
  EURUSD: 'Currency',
  BTCUSD: 'Digital asset',
  US10Y: 'Sovereign fixed income',
  SPY26C550: 'Equity derivative',
  'PRIV-NOTE': 'Private credit',
};

// Fallback when a symbol is in neither table: the instrument type still says what kind of thing it
// is, so nothing is left silently unclassified.
const ASSET_CLASS_BY_TYPE: Readonly<Record<InstrumentTypeDto, string | null>> = {
  intraday: null,
  swing: null,
  long_term: null,
  ipo: null,
  etf: 'Broad market fund',
  mutual_fund: 'Broad market fund',
  bond: 'Corporate fixed income',
  commodity: 'Commodity',
  currency_pair: 'Currency',
  derivative: 'Equity derivative',
  digital_asset: 'Digital asset',
  unlisted: 'Private credit',
};

export function assetClassForType(type: InstrumentTypeDto): string | null {
  return ASSET_CLASS_BY_TYPE[type];
}

// Provider coverage is deliberately partial: a real provider classifies the names it covers and
// leaves the rest, and the interface has to show that state rather than invent a mapping.
export const PROVIDER_MAPPINGS_BY_SYMBOL: Readonly<
  Record<string, readonly ProviderClassificationDto[]>
> = {
  RELIANCE: [
    {
      provider: 'NSE India',
      scheme: 'NSE sector and basic industry',
      sector: 'Oil Gas & Consumable Fuels',
      industry: 'Refineries & Marketing',
    },
  ],
  TATAMOTORS: [
    {
      provider: 'NSE India',
      scheme: 'NSE sector and basic industry',
      sector: 'Automobile and Auto Components',
      industry: 'Passenger Cars & Utility Vehicles',
    },
  ],
  TCS: [
    {
      provider: 'NSE India',
      scheme: 'NSE sector and basic industry',
      sector: 'Information Technology',
      industry: 'Computers - Software & Consulting',
    },
  ],
  HDFCBANK: [
    {
      provider: 'NSE India',
      scheme: 'NSE sector and basic industry',
      sector: 'Financial Services',
      industry: 'Private Sector Bank',
    },
  ],
  INFY: [
    {
      provider: 'NSE India',
      scheme: 'NSE sector and basic industry',
      sector: 'Information Technology',
      industry: 'Computers - Software & Consulting',
    },
  ],
  AAPL: [
    {
      provider: 'Global reference provider',
      scheme: 'Provider global sector scheme',
      sector: 'Information Technology',
      industry: 'Technology Hardware, Storage & Peripherals',
    },
  ],
  NVDA: [
    {
      provider: 'Global reference provider',
      scheme: 'Provider global sector scheme',
      sector: 'Information Technology',
      industry: 'Semiconductors & Semiconductor Equipment',
    },
  ],
};

// Business and promoter groups. Group exposure is measured alongside sector exposure (decision 51),
// because several companies of one group move together whatever their sectors say.
export const GROUPS: Readonly<Record<string, string>> = {
  'grp-tata': 'Tata group',
  'grp-reliance': 'Reliance group',
  'grp-hdfc': 'HDFC group',
  'grp-toyota': 'Toyota group',
  'grp-alphabet': 'Alphabet',
  'grp-berkshire': 'Berkshire Hathaway',
};

export const GROUP_ID_BY_SYMBOL: Readonly<Record<string, string>> = {
  TATAMOTORS: 'grp-tata',
  TCS: 'grp-tata',
  RELIANCE: 'grp-reliance',
  HDFCBANK: 'grp-hdfc',
  '7203': 'grp-toyota',
  GOOGL: 'grp-alphabet',
  'BRK.B': 'grp-berkshire',
};
