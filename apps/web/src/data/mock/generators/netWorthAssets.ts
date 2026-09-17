// Manual assets for the net worth register (requirements 25; UI spec 19.4): every category, one
// deliberately stale record, one never verified, a loan secured against the property and employer
// equity partly vested. Dates are relative to the day the mock loads. Mock figures only.

import { Decimal } from 'decimal.js';

import type { ManualAssetDto } from '../../schemas';
import { addDays, daysBetween } from './reportValuation';

type Seed = Omit<ManualAssetDto, 'valuedOn' | 'maturityOn' | 'vesting'> & {
  readonly valuedDaysAgo: number;
  readonly maturesInDays: number | null;
  readonly vesting: {
    readonly unvestedValue: string;
    readonly nextVestInDays: number;
    readonly lockInDays: number | null;
  } | null;
};

const NONE = {
  annualRatePercent: null,
  maturesInDays: null,
  issuer: null,
  sector: null,
  purchaseCost: null,
  securedAgainstId: null,
  vesting: null,
} as const;

export const EMPLOYER = 'Northwind Systems';
// Yearly salary from the same employer, in INR: the other half of the employer exposure.
export const ANNUAL_SALARY = { amount: '4500000.00', currency: 'INR' as const };

const SEEDS: readonly Seed[] = [
  {
    ...NONE,
    id: 'asset-epf',
    category: 'retirement',
    name: 'Employees’ Provident Fund',
    institution: 'EPFO',
    currency: 'INR',
    value: '1840000.00',
    valuedDaysAgo: 40,
    method: 'formula',
    annualRatePercent: 8.25,
    liquidity: 'locked',
    staleAfterDays: 90,
    verified: true,
    issuer: 'Government of India',
    assetClass: 'fixed_income',
  },
  {
    ...NONE,
    id: 'asset-ppf',
    category: 'retirement',
    name: 'Public Provident Fund',
    institution: 'State Bank of India',
    currency: 'INR',
    value: '950000.00',
    // Deliberately past its 180-day age: the annual statement has not been entered yet.
    valuedDaysAgo: 212,
    method: 'periodic',
    liquidity: 'locked',
    staleAfterDays: 180,
    verified: true,
    maturesInDays: 1660,
    issuer: 'Government of India',
    assetClass: 'fixed_income',
  },
  {
    ...NONE,
    id: 'asset-savings',
    category: 'cash_deposit',
    name: 'Savings account',
    institution: 'HDFC Bank',
    currency: 'INR',
    value: '420000.00',
    valuedDaysAgo: 12,
    method: 'manual',
    liquidity: 'immediate',
    staleAfterDays: 30,
    verified: true,
    issuer: 'HDFC Bank',
    assetClass: 'cash',
  },
  {
    ...NONE,
    id: 'asset-fd',
    category: 'cash_deposit',
    name: 'Fixed deposit',
    institution: 'ICICI Bank',
    currency: 'INR',
    value: '1000000.00',
    valuedDaysAgo: 150,
    method: 'formula',
    annualRatePercent: 7.1,
    liquidity: 'within_year',
    staleAfterDays: 365,
    verified: true,
    maturesInDays: 180,
    issuer: 'ICICI Bank',
    assetClass: 'cash',
  },
  {
    ...NONE,
    id: 'asset-sgb',
    category: 'gold',
    name: 'Sovereign Gold Bonds',
    institution: 'Reserve Bank of India',
    currency: 'INR',
    value: '680000.00',
    valuedDaysAgo: 25,
    method: 'manual',
    liquidity: 'within_month',
    staleAfterDays: 60,
    verified: true,
    maturesInDays: 1400,
    issuer: 'Government of India',
    assetClass: 'gold',
  },
  {
    ...NONE,
    id: 'asset-jewellery',
    category: 'gold',
    name: 'Gold jewellery',
    institution: 'Held at home',
    currency: 'INR',
    value: '550000.00',
    valuedDaysAgo: 70,
    method: 'manual',
    liquidity: 'within_month',
    staleAfterDays: 180,
    // Never weighed or valued independently: an estimate only.
    verified: false,
    assetClass: 'gold',
  },
  {
    ...NONE,
    id: 'asset-apartment',
    category: 'property',
    name: 'Apartment, Bengaluru',
    institution: 'Self-occupied',
    currency: 'INR',
    value: '12000000.00',
    valuedDaysAgo: 300,
    method: 'manual',
    liquidity: 'locked',
    staleAfterDays: 365,
    verified: true,
    purchaseCost: '8500000.00',
    assetClass: 'real_estate',
  },
  {
    ...NONE,
    id: 'asset-lic',
    category: 'insurance',
    name: 'Endowment policy (surrender value)',
    institution: 'LIC',
    currency: 'INR',
    value: '310000.00',
    valuedDaysAgo: 150,
    method: 'periodic',
    liquidity: 'locked',
    staleAfterDays: 365,
    verified: true,
    maturesInDays: 2900,
    issuer: 'LIC',
    assetClass: 'insurance',
  },
  {
    ...NONE,
    id: 'asset-rsu',
    category: 'employer_equity',
    name: 'Restricted stock units (vested)',
    institution: `${EMPLOYER} equity plan`,
    currency: 'USD',
    value: '42000.00',
    valuedDaysAgo: 20,
    method: 'manual',
    liquidity: 'within_month',
    staleAfterDays: 30,
    verified: true,
    issuer: EMPLOYER,
    sector: 'Information technology',
    assetClass: 'equity',
    vesting: { unvestedValue: '28000.00', nextVestInDays: 45, lockInDays: 20 },
  },
  {
    ...NONE,
    id: 'liability-home-loan',
    category: 'liability',
    name: 'Home loan',
    institution: 'HDFC Bank',
    currency: 'INR',
    value: '4800000.00',
    valuedDaysAgo: 20,
    method: 'periodic',
    liquidity: 'immediate',
    staleAfterDays: 45,
    verified: true,
    maturesInDays: 5200,
    securedAgainstId: 'asset-apartment',
    assetClass: 'other',
  },
  {
    ...NONE,
    id: 'liability-card',
    category: 'liability',
    name: 'Credit card balance',
    institution: 'Axis Bank',
    currency: 'INR',
    value: '85000.00',
    valuedDaysAgo: 3,
    method: 'manual',
    liquidity: 'immediate',
    staleAfterDays: 35,
    verified: true,
    assetClass: 'other',
  },
];

export function seedManualAssets(today: string): ManualAssetDto[] {
  return SEEDS.map(({ valuedDaysAgo, maturesInDays, vesting, ...seed }) => ({
    ...seed,
    valuedOn: addDays(today, -valuedDaysAgo),
    maturityOn: maturesInDays === null ? null : addDays(today, maturesInDays),
    vesting:
      vesting === null
        ? null
        : {
            unvestedValue: vesting.unvestedValue,
            nextVestOn: addDays(today, vesting.nextVestInDays),
            lockInUntil: vesting.lockInDays === null ? null : addDays(today, vesting.lockInDays),
          },
  }));
}

// A formula value accrues simply from its recorded value at the yearly rate; others stay as recorded.
export function currentAmount(asset: ManualAssetDto, today: string): Decimal {
  const recorded = new Decimal(asset.value);
  if (asset.method !== 'formula' || asset.annualRatePercent === null) return recorded;
  const years = new Decimal(Math.max(0, daysBetween(asset.valuedOn, today))).dividedBy(365);
  return recorded.times(new Decimal(1).plus(years.times(asset.annualRatePercent).dividedBy(100)));
}
