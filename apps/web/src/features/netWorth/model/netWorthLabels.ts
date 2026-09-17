// Words for the net worth screen (requirements 25): categories, liquidity, valuation methods and
// asset classes, and a blank new asset.

import type {
  AssetClassDto,
  LiquidityClassDto,
  ManualAssetCategoryDto,
  ManualAssetFieldsInput,
  ValuationMethodDto,
} from '../../../data/schemas';
import {
  AssetClassSchema,
  LiquidityClassSchema,
  ManualAssetCategorySchema,
  ValuationMethodSchema,
} from '../../../data/schemas';

export const CATEGORY_LABELS: Readonly<Record<ManualAssetCategoryDto, string>> = {
  retirement: 'Retirement and statutory savings',
  cash_deposit: 'Cash and deposits',
  gold: 'Gold',
  property: 'Property',
  insurance: 'Insurance-linked savings',
  employer_equity: 'Employer equity',
  liability: 'Liability',
};

export const LIQUIDITY_LABELS: Readonly<Record<LiquidityClassDto, string>> = {
  immediate: 'Cash today',
  within_month: 'Within a month',
  within_year: 'Within a year',
  locked: 'Locked for over a year',
};

export const METHOD_LABELS: Readonly<Record<ValuationMethodDto, string>> = {
  manual: 'Entered by hand',
  periodic: 'From a periodic statement',
  formula: 'Accrues at a rate',
};

export const ASSET_CLASS_LABELS: Readonly<Record<AssetClassDto, string>> = {
  equity: 'Equity',
  fixed_income: 'Fixed income',
  cash: 'Cash',
  gold: 'Gold',
  real_estate: 'Real estate',
  insurance: 'Insurance',
  digital_asset: 'Digital assets',
  other: 'Other',
};

const options = <T extends string>(
  values: readonly T[],
  labels: Readonly<Record<T, string>>,
): { value: T; label: string }[] => values.map((value) => ({ value, label: labels[value] }));

export const CATEGORY_OPTIONS = options(ManualAssetCategorySchema.options, CATEGORY_LABELS);
export const LIQUIDITY_OPTIONS = options(LiquidityClassSchema.options, LIQUIDITY_LABELS);
export const METHOD_OPTIONS = options(ValuationMethodSchema.options, METHOD_LABELS);
export const ASSET_CLASS_OPTIONS = options(AssetClassSchema.options, ASSET_CLASS_LABELS);

export function blankAsset(today: string): ManualAssetFieldsInput {
  return {
    category: 'cash_deposit',
    name: '',
    institution: '',
    currency: 'INR',
    value: '',
    valuedOn: today,
    method: 'manual',
    annualRatePercent: null,
    liquidity: 'immediate',
    staleAfterDays: 90,
    verified: false,
    maturityOn: null,
    issuer: null,
    sector: null,
    assetClass: 'cash',
    purchaseCost: null,
    securedAgainstId: null,
    vesting: null,
  };
}

export const describeAge = (days: number): string =>
  days === 0 ? 'today' : days === 1 ? '1 day ago' : `${String(days)} days ago`;
