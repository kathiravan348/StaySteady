// Editing tax rule sets (E-09; decision 45): option lists and versions described in the screen's own
// words for the diff.

import type {
  CostBasisMethodDto,
  TaxAssetClassDto,
  TaxRuleSetConfigInput,
} from '../../../../data/schemas';
import { TaxAssetClassSchema } from '../../../../data/schemas';
import { TAX_ASSET_CLASS_LABEL } from '../../../../shared/tax/taxRules';

export const ASSET_CLASS_OPTIONS: readonly { value: TaxAssetClassDto; label: string }[] =
  TaxAssetClassSchema.options.map((value) => ({ value, label: TAX_ASSET_CLASS_LABEL[value] }));

export const COST_BASIS_OPTIONS: readonly { value: CostBasisMethodDto; label: string }[] = [
  { value: 'fifo', label: 'First in, first out' },
  { value: 'average', label: 'Average cost' },
  { value: 'specific_lot', label: 'Chosen lot' },
];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function describeTaxRuleSet(config: TaxRuleSetConfigInput): Record<string, string> {
  const rules = Object.fromEntries(
    config.rules.map((rule) => [
      TAX_ASSET_CLASS_LABEL[rule.assetClass],
      rule.longTermAfterDays === null
        ? `${String(rule.shortTermRatePercent)}%, no long-term treatment`
        : `${String(rule.shortTermRatePercent)}% short, ${String(rule.longTermRatePercent)}% long after ${String(rule.longTermAfterDays)} days, exempt up to ${rule.longTermExemption} ${config.currency}`,
    ]),
  );
  const protections = Object.fromEntries(
    config.costBasisProtections.map((item) => [
      `Protection: ${TAX_ASSET_CLASS_LABEL[item.assetClass]}`,
      `Bought before ${item.acquiredBefore}: ${item.description}`,
    ]),
  );
  const cap = config.foreignAssets.remittanceCapPerYear;
  return {
    Residence: config.isResidence ? 'Yes' : 'No',
    'Tax year starts': `${String(config.taxYearStart.day)} ${MONTHS[config.taxYearStart.month - 1] ?? ''}`,
    'Cost basis':
      COST_BASIS_OPTIONS.find((item) => item.value === config.costBasisMethod)?.label ?? '',
    'Losses carried forward':
      config.lossCarryForwardYears === null
        ? 'Indefinitely'
        : `${String(config.lossCarryForwardYears)} years`,
    ...rules,
    ...protections,
    'Foreign asset disclosure': config.foreignAssets.annualDisclosureRequired
      ? 'Every year'
      : 'None',
    'Remittance cap': cap === null ? 'None' : `${cap.amount} ${cap.currency} a year`,
    'Foreign tax credit': config.foreignAssets.foreignTaxCreditClaimable
      ? 'Claimable'
      : 'Not claimable',
  };
}
