// MSW handlers for the liquidity plan (E-07). The view is rebuilt on every read from holdings,
// trading cash, market and instrument type settlement and strategy stages.

import { Decimal } from 'decimal.js';
import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  generateCurrentFxRates,
  generatePortfolioData,
  generateStrategies,
  getInstrumentById,
  parseGenerated,
} from '../generators';
import { buildLiquidityView, seedLiquidityPlan } from '../generators/planningLiquidity';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  currentConfigs,
  getInstrumentTypeVersions,
  getMarketVersions,
} from '../stores/configStore';
import { tradingContext } from '../stores/tradingStore';
import type { LiquidityPlanInput } from '../../schemas';
import { LiquidityViewSchema, SaveLiquidityPlanSchema } from '../../schemas';
import { failure, firstIssue } from './versionedConfigHandlers';

const today = (): string => new Date().toISOString().slice(0, 10);
let saved: LiquidityPlanInput | null = null;

function view(): Response {
  const plan = (saved ??= seedLiquidityPlan(today()));
  const { holdings, summary } = generatePortfolioData(tradingContext);
  const result = buildLiquidityView(plan, {
    today: today(),
    holdings,
    cash: summary.cashBalance,
    instrument: getInstrumentById,
    markets: currentConfigs(getMarketVersions()),
    instrumentTypes: currentConfigs(getInstrumentTypeVersions()),
    strategies: generateStrategies(tradingContext),
    fxTable: generateCurrentFxRates(tradingContext).map((rate) => ({
      from: rate.from,
      to: rate.to,
      rate: new Decimal(rate.rate),
    })),
  });
  return HttpResponse.json(parseGenerated(LiquidityViewSchema, result, 'liquidity'), {
    status: 200,
  });
}

export const planningLiquidityHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/planning/liquidity', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load the liquidity plan', 500)
      : view(),
  ),

  http.put('/api/v1/planning/liquidity', async ({ request }) => {
    const parsed = SaveLiquidityPlanSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    saved = parsed.data.plan;
    return view();
  }),
];
