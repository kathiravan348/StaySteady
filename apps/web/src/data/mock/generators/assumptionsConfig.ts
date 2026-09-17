// Seeded planning assumptions and operating policy with invented history, and the health each shows
// (E-09; requirements 30, 32, 34). Running cost is the enabled data providers' monthly budgets plus
// the manual items, compared with the budget and with portfolio value. Mock figures only.

import { Decimal } from 'decimal.js';

import type { ConfigHealthDto, InflationHistoryDto, ProviderConfigInput } from '../../schemas';
import type {
  InflationAssumptionConfigInput,
  OperatingCostSummaryDto,
  OperatingPolicyConfigInput,
} from '../../schemas/config-assumptions';
import type { FxQuote, Money } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import type { CurrencyCode } from '../../../shared/types/currency';
import { COUNTERPARTY_MAX_SHARE_PERCENT } from './counterpartyProfiles';

type History<T> = readonly { version: number; savedAt: string; reason: string; snapshot: T }[];

const INITIAL = { version: 1, savedAt: '2024-01-02T00:00:00.000Z' } as const;
// Assumption and recorded average may differ by this many points before it is worth a warning.
const DRIFT_POINTS = 1.5;
const RECENT_YEARS = 3;

export function seedInflationAssumptions(): readonly InflationAssumptionConfigInput[] {
  return [
    { country: 'US', assumedAnnualPercent: 2.5, useRecordedHistory: true, reviewEveryDays: 180 },
    { country: 'IN', assumedAnnualPercent: 4.5, useRecordedHistory: true, reviewEveryDays: 180 },
    { country: 'GB', assumedAnnualPercent: 2.0, useRecordedHistory: true, reviewEveryDays: 365 },
  ];
}

export function seedInflationAssumptionHistory(
  current: InflationAssumptionConfigInput,
): History<InflationAssumptionConfigInput> {
  const initial = { ...INITIAL, reason: 'Initial assumptions.' };
  if (current.country === 'IN') {
    return [
      {
        version: 2,
        savedAt: '2025-11-03T00:00:00.000Z',
        reason: 'Inflation eased through 2025; long-run assumption lowered from 5.5% to 4.5%.',
        snapshot: current,
      },
      { ...initial, snapshot: { ...current, assumedAnnualPercent: 5.5 } },
    ];
  }
  return [{ ...initial, snapshot: current }];
}

export function inflationAssumptionHealth(
  config: InflationAssumptionConfigInput,
  history: InflationHistoryDto,
): ConfigHealthDto {
  const series = history.find((item) => item.country === config.country);
  const recorded = series?.years.filter((year) => !year.isEstimate).slice(-RECENT_YEARS) ?? [];
  if (recorded.length === 0) {
    return {
      status: 'warning',
      summary: 'No recorded inflation; every period uses the assumption.',
    };
  }
  const average = recorded.reduce((sum, year) => sum + year.ratePercent, 0) / recorded.length;
  const drift = config.assumedAnnualPercent - average;
  const words = `Assumed ${config.assumedAnnualPercent.toFixed(1)}% against a recorded ${String(recorded.length)}-year average of ${average.toFixed(1)}%.`;
  if (Math.abs(drift) > DRIFT_POINTS) {
    return {
      status: 'warning',
      summary: `${words} ${drift < 0 ? 'Projections may overstate real growth.' : 'Projections may be cautious.'}`,
    };
  }
  return { status: 'healthy', summary: words };
}

export function seedOperatingPolicy(): OperatingPolicyConfigInput {
  return {
    id: 'operating-policy',
    costBudget: {
      currency: 'USD',
      monthlyBudget: '800.00',
      warnAtPercent: 85,
      maxShareOfPortfolioBps: 100,
      manualItems: [
        { id: 'cost-vps', label: 'Virtual server', category: 'hosting', monthlyAmount: '24.00' },
        { id: 'cost-backup', label: 'Offsite backups', category: 'backup', monthlyAmount: '6.00' },
        { id: 'cost-domain', label: 'Domain and email', category: 'other', monthlyAmount: '4.00' },
      ],
    },
    counterpartyMaxSharePercent: COUNTERPARTY_MAX_SHARE_PERCENT,
    safeguards: {
      coolingOffMinutes: 5,
      coolingOffAbove: { currency: 'USD', amount: '5000.00' },
      requireStatedReason: true,
    },
    export: {
      formats: ['csv', 'json'],
      schedule: 'monthly',
      datasets: ['holdings', 'lots', 'transactions', 'income', 'costs', 'configuration'],
      includeFieldDictionary: true,
      retentionYears: 8,
    },
  };
}

export function seedOperatingPolicyHistory(
  current: OperatingPolicyConfigInput,
): History<OperatingPolicyConfigInput> {
  return [
    {
      version: 2,
      savedAt: '2025-06-20T00:00:00.000Z',
      reason: 'Backup news provider added; budget raised from 650 to 800 USD.',
      snapshot: current,
    },
    {
      ...INITIAL,
      reason: 'Initial operating policy.',
      snapshot: { ...current, costBudget: { ...current.costBudget, monthlyBudget: '650.00' } },
    },
  ];
}

export interface OperatingCostInputs {
  readonly providers: readonly ProviderConfigInput[];
  readonly fxTable: readonly FxQuote[];
  // Holdings and cash together, in any currency; null when unknown.
  readonly portfolioValue: Money | null;
}

export function operatingCostSummary(
  config: OperatingPolicyConfigInput,
  inputs: OperatingCostInputs,
): OperatingCostSummaryDto {
  const currency: CurrencyCode = config.costBudget.currency;
  const inBudget = (money: Money): Decimal =>
    convertMoneyWithTable(money, currency, inputs.fxTable).amount;
  const providerLines = inputs.providers
    .filter((provider) => provider.enabled)
    .map((provider) => ({
      label: provider.name,
      category: 'data' as const,
      source: 'provider' as const,
      amount: inBudget(createMoney(provider.cost.monthlyBudget, provider.cost.currency)),
    }));
  const manualLines = config.costBudget.manualItems.map((item) => ({
    label: item.label,
    category: item.category,
    source: 'manual' as const,
    amount: new Decimal(item.monthlyAmount),
  }));
  const lines = [...providerLines, ...manualLines];
  const total = lines.reduce((sum, line) => sum.plus(line.amount), new Decimal(0));
  const budget = new Decimal(config.costBudget.monthlyBudget);
  const portfolio = inputs.portfolioValue === null ? null : inBudget(inputs.portfolioValue);
  return {
    lines: lines.map(({ amount, ...line }) => ({
      ...line,
      monthlyAmount: { amount: amount.toFixed(2), currency },
    })),
    monthlyTotal: { amount: total.toFixed(2), currency },
    budgetUsedPercent: budget.isZero()
      ? 0
      : total.dividedBy(budget).times(100).toDecimalPlaces(1).toNumber(),
    yearlyShareOfPortfolioBps:
      portfolio === null || portfolio.isZero()
        ? null
        : total.times(12).dividedBy(portfolio).times(10_000).toDecimalPlaces(0).toNumber(),
  };
}

export function operatingPolicyHealth(
  config: OperatingPolicyConfigInput,
  costs: OperatingCostSummaryDto,
): ConfigHealthDto {
  const problems: { status: 'critical' | 'warning'; words: string }[] = [];
  const used = costs.budgetUsedPercent;
  if (used > 100) {
    problems.push({
      status: 'critical',
      words: `Running costs are ${used.toFixed(0)}% of the monthly budget.`,
    });
  } else if (used >= config.costBudget.warnAtPercent) {
    problems.push({
      status: 'warning',
      words: `Running costs have reached ${used.toFixed(0)}% of the monthly budget.`,
    });
  }
  const share = costs.yearlyShareOfPortfolioBps;
  if (share !== null && share > config.costBudget.maxShareOfPortfolioBps) {
    problems.push({
      status: 'warning',
      words: `A year of running costs is ${(share / 100).toFixed(2)}% of portfolio value, above ${(config.costBudget.maxShareOfPortfolioBps / 100).toFixed(2)}%.`,
    });
  }
  if (config.export.schedule === 'off') {
    problems.push({
      status: 'warning',
      words: 'No scheduled export; data is only exported on demand.',
    });
  }
  if (problems.length === 0) {
    return { status: 'healthy', summary: `Running costs are ${used.toFixed(0)}% of budget.` };
  }
  return {
    status: problems.some((problem) => problem.status === 'critical') ? 'critical' : 'warning',
    summary: problems.map((problem) => problem.words).join(' '),
  };
}
