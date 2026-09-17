// Editing planning assumptions and the operating policy (E-09; UI spec 7.18): option lists and
// versions described in the screen's own words for the diff.

import type {
  CostCategoryDto,
  ExportDatasetDto,
  InflationAssumptionConfigInput,
  InflationCountryDto,
  ManualCostItemInput,
  OperatingPolicyConfigInput,
} from '../../../../data/schemas';

export const COUNTRY_LABEL: Readonly<Record<InflationCountryDto, string>> = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
};

export const CATEGORY_OPTIONS: readonly { value: CostCategoryDto; label: string }[] = [
  { value: 'hosting', label: 'Hosting' },
  { value: 'data', label: 'Data' },
  { value: 'broker', label: 'Broker charges' },
  { value: 'backup', label: 'Backups' },
  { value: 'other', label: 'Other' },
];

export const DATASET_OPTIONS: readonly { value: ExportDatasetDto; label: string }[] = [
  { value: 'holdings', label: 'Holdings' },
  { value: 'lots', label: 'Lots' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'income', label: 'Income' },
  { value: 'costs', label: 'Costs' },
  { value: 'configuration', label: 'Configuration' },
  { value: 'history', label: 'Price and value history' },
];

export const FORMAT_OPTIONS: readonly { value: 'csv' | 'json'; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
];

export const SCHEDULE_OPTIONS: readonly { value: 'off' | 'weekly' | 'monthly'; label: string }[] = [
  { value: 'off', label: 'On demand only' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const labelOf = <T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
): string => options.find((option) => option.value === value)?.label ?? value;

export const percentFromBps = (bps: number): string => `${(bps / 100).toFixed(2)}%`;

export function describeInflation(config: InflationAssumptionConfigInput): Record<string, string> {
  return {
    'Assumed inflation': `${config.assumedAnnualPercent.toFixed(1)}% a year`,
    'Past periods use': config.useRecordedHistory ? 'Recorded inflation' : 'The assumption',
    'Review every': `${String(config.reviewEveryDays)} days`,
  };
}

export function describeOperatingPolicy(
  config: OperatingPolicyConfigInput,
): Record<string, string> {
  const { costBudget, export: exports } = config;
  const items = Object.fromEntries(
    costBudget.manualItems.map((item) => [
      `Cost: ${item.label}`,
      `${item.monthlyAmount} ${costBudget.currency} a month (${labelOf(CATEGORY_OPTIONS, item.category)})`,
    ]),
  );
  return {
    'Monthly budget': `${costBudget.monthlyBudget} ${costBudget.currency}`,
    'Warn at': `${String(costBudget.warnAtPercent)}% of budget`,
    'Largest yearly cost share': percentFromBps(costBudget.maxShareOfPortfolioBps),
    ...items,
    'Counterparty over-weight above': `${String(config.counterpartyMaxSharePercent)}% of net worth`,
    'Cooling-off period':
      config.safeguards.coolingOffMinutes === 0
        ? 'Off'
        : `${String(config.safeguards.coolingOffMinutes)} min above ${config.safeguards.coolingOffAbove.amount} ${config.safeguards.coolingOffAbove.currency}`,
    'Stated reason': config.safeguards.requireStatedReason ? 'Required' : 'Optional',
    'Export formats': exports.formats.map((value) => labelOf(FORMAT_OPTIONS, value)).join(', '),
    'Export schedule': labelOf(SCHEDULE_OPTIONS, exports.schedule),
    'Exported data': exports.datasets.map((value) => labelOf(DATASET_OPTIONS, value)).join(', '),
    'Field descriptions': exports.includeFieldDictionary ? 'Included' : 'Not included',
    'Keep exports for': `${String(exports.retentionYears)} years`,
  };
}

export function newManualItem(existing: readonly ManualCostItemInput[]): ManualCostItemInput {
  let index = existing.length + 1;
  while (existing.some((item) => item.id === `cost-item-${String(index)}`)) index += 1;
  return { id: `cost-item-${String(index)}`, label: '', category: 'other', monthlyAmount: '0.00' };
}
