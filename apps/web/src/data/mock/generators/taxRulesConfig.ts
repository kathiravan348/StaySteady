// Seeded tax rule set for an India-resident owner holding foreign shares (E-09; requirements 26;
// decision 45), with the July 2024 budget change as its version history. Mock figures summarising
// public rules, never advice.

import type { ConfigHealthDto, InstrumentTypeDto, TaxRuleSetConfigInput } from '../../schemas';
import { taxAssetClassOf } from '../../../shared/tax/taxRules';

type History<T> = readonly { version: number; savedAt: string; reason: string; snapshot: T }[];

export function seedTaxRuleSets(): readonly TaxRuleSetConfigInput[] {
  return [
    {
      country: 'IN',
      isResidence: true,
      currency: 'INR',
      taxYearStart: { month: 4, day: 1 },
      costBasisMethod: 'fifo',
      lossCarryForwardYears: 8,
      rules: [
        {
          assetClass: 'domestic_equity',
          longTermAfterDays: 365,
          shortTermRatePercent: 20,
          longTermRatePercent: 12.5,
          longTermExemption: '125000.00',
        },
        {
          assetClass: 'domestic_equity_fund',
          longTermAfterDays: 365,
          shortTermRatePercent: 20,
          longTermRatePercent: 12.5,
          longTermExemption: '125000.00',
        },
        {
          assetClass: 'foreign_equity',
          longTermAfterDays: 730,
          shortTermRatePercent: 30,
          longTermRatePercent: 12.5,
          longTermExemption: '0.00',
        },
        {
          assetClass: 'debt',
          longTermAfterDays: null,
          shortTermRatePercent: 30,
          longTermRatePercent: 30,
          longTermExemption: '0.00',
        },
        {
          assetClass: 'gold',
          longTermAfterDays: 730,
          shortTermRatePercent: 30,
          longTermRatePercent: 12.5,
          longTermExemption: '0.00',
        },
        {
          assetClass: 'other',
          longTermAfterDays: null,
          shortTermRatePercent: 30,
          longTermRatePercent: 30,
          longTermExemption: '0.00',
        },
      ],
      costBasisProtections: [
        {
          assetClass: 'domestic_equity',
          acquiredBefore: '2018-02-01',
          description: 'Cost is the higher of the purchase price and the 31 January 2018 price.',
        },
      ],
      foreignAssets: {
        annualDisclosureRequired: true,
        remittanceCapPerYear: { currency: 'USD', amount: '250000.00' },
        foreignTaxCreditClaimable: true,
      },
    },
  ];
}

export function seedTaxRuleSetHistory(
  current: TaxRuleSetConfigInput,
): History<TaxRuleSetConfigInput> {
  const before = current.rules.map((rule) => {
    if (rule.assetClass === 'domestic_equity' || rule.assetClass === 'domestic_equity_fund') {
      return {
        ...rule,
        shortTermRatePercent: 15,
        longTermRatePercent: 10,
        longTermExemption: '100000.00',
      };
    }
    if (rule.assetClass === 'foreign_equity' || rule.assetClass === 'gold') {
      return { ...rule, longTermAfterDays: 1095, longTermRatePercent: 20 };
    }
    return rule;
  });
  return [
    {
      version: 2,
      savedAt: '2024-07-23T00:00:00.000Z',
      reason:
        'Budget 2024: listed equity 20% short and 12.5% long with a 1.25 lakh exemption; foreign shares and gold long-term after 24 months at 12.5%.',
      snapshot: current,
    },
    {
      version: 1,
      savedAt: '2024-01-02T00:00:00.000Z',
      reason: 'Initial rules for an India-resident owner.',
      snapshot: { ...current, rules: before },
    },
  ];
}

export interface HeldInstrument {
  readonly type: InstrumentTypeDto;
  readonly marketId: string;
  readonly symbol: string;
}

export function taxRuleSetHealth(
  config: TaxRuleSetConfigInput,
  held: readonly HeldInstrument[],
): ConfigHealthDto {
  if (!config.isResidence) {
    return { status: 'healthy', summary: 'Kept for reference; the residence rule set applies.' };
  }
  const classes = new Set(held.map((item) => taxAssetClassOf(item, config.country)));
  const missing = [...classes].filter(
    (assetClass) =>
      !config.rules.some((rule) => rule.assetClass === assetClass || rule.assetClass === 'other'),
  );
  if (missing.length > 0) {
    return {
      status: 'warning',
      summary: `Holdings in ${missing.join(', ')} have no rule, so no tax is estimated for them.`,
    };
  }
  if (classes.has('foreign_equity') && !config.foreignAssets.annualDisclosureRequired) {
    return {
      status: 'warning',
      summary: 'Foreign shares are held but no annual foreign asset disclosure is set.',
    };
  }
  return {
    status: 'healthy',
    summary: `Residence rules cover all ${String(classes.size)} asset classes held; tax year from ${String(config.taxYearStart.day)}/${String(config.taxYearStart.month)}.`,
  };
}
