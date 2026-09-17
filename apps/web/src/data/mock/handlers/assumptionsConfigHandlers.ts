// MSW handlers for inflation assumptions and the operating policy (E-09; UI spec 7.18), built on the
// versioned configuration factory. Health and running costs are worked out on every read from the
// saved provider costs, recorded inflation and the current portfolio value.

import { Decimal } from 'decimal.js';
import type { HttpHandler } from 'msw';

import {
  generateCurrentFxRates,
  generateInflationHistory,
  generatePortfolioData,
} from '../generators';
import {
  inflationAssumptionHealth,
  operatingCostSummary,
  operatingPolicyHealth,
} from '../generators/assumptionsConfig';
import {
  getInflationAssumptionVersions,
  getOperatingPolicyVersions,
} from '../stores/assumptionsStore';
import { currentConfigs, getProviderVersions } from '../stores/configStore';
import { tradingContext } from '../stores/tradingStore';
import type {
  InflationAssumptionConfigInput,
  OperatingPolicyConfigInput,
} from '../../schemas/config-assumptions';
import {
  InflationAssumptionListSchema,
  OperatingPolicyListSchema,
  SaveInflationAssumptionRequestSchema,
  SaveOperatingPolicyRequestSchema,
} from '../../schemas/config-assumptions';
import type { FxQuote } from '../../../shared/money';
import { createMoney } from '../../../shared/money';
import { versionedConfigHandlers } from './versionedConfigHandlers';

const today = (): string => new Date().toISOString().slice(0, 10);

function inflationEntries(): unknown[] {
  const history = generateInflationHistory(today());
  return [...getInflationAssumptionVersions().values()].flatMap((versions) => {
    const config = versions[0]?.snapshot;
    return config === undefined
      ? []
      : [{ config, health: inflationAssumptionHealth(config, history), versions }];
  });
}

function operatingEntries(): unknown[] {
  const fxTable: readonly FxQuote[] = generateCurrentFxRates(tradingContext).map((rate) => ({
    from: rate.from,
    to: rate.to,
    rate: new Decimal(rate.rate),
  }));
  const { summary } = generatePortfolioData(tradingContext);
  const portfolioValue = createMoney(
    new Decimal(summary.totalValue.amount).plus(summary.cashBalance.amount),
    summary.totalValue.currency,
  );
  const providers = currentConfigs(getProviderVersions());
  return [...getOperatingPolicyVersions().values()].flatMap((versions) => {
    const config = versions[0]?.snapshot;
    if (config === undefined) return [];
    const costs = operatingCostSummary(config, { providers, fxTable, portfolioValue });
    return [{ config, health: operatingPolicyHealth(config, costs), costs, versions }];
  });
}

export const assumptionsConfigHandlers: readonly HttpHandler[] = [
  ...versionedConfigHandlers<InflationAssumptionConfigInput>({
    path: '/api/v1/config/inflation-assumptions',
    noun: 'Inflation assumption',
    idOf: (config) => config.country,
    store: getInflationAssumptionVersions,
    listSchema: InflationAssumptionListSchema,
    saveSchema: SaveInflationAssumptionRequestSchema,
    entries: inflationEntries,
    allowCreate: false,
  }),
  ...versionedConfigHandlers<OperatingPolicyConfigInput>({
    path: '/api/v1/config/operating-policy',
    noun: 'Operating policy',
    idOf: (config) => config.id,
    store: getOperatingPolicyVersions,
    listSchema: OperatingPolicyListSchema,
    saveSchema: SaveOperatingPolicyRequestSchema,
    entries: operatingEntries,
    allowCreate: false,
  }),
];
