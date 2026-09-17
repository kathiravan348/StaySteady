// Read-only reference data for Requirements Part II (M-17; UI spec 19.4): inflation history, capital
// losses carried forward, counterparty profiles and strategy lifecycles. Each fails with the API in
// the loading-error scenario.

import { http, HttpResponse, type HttpHandler, type JsonBodyType } from 'msw';

import { Decimal } from 'decimal.js';

import {
  buildCounterpartyExposure,
  generateCounterparties,
  generateCurrentFxRates,
  generatePortfolioData,
  generateInflationHistory,
  generateLossCarryForwards,
  generateStrategyLibrary,
  generateStrategyLifecycles,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { currentOperatingPolicy } from '../stores/assumptionsStore';
import { currentTaxRuleSets } from '../stores/taxRulesStore';
import { tradingContext } from '../stores/tradingStore';
import { residenceRules } from '../../../shared/tax/taxRules';
import { failure } from './versionedConfigHandlers';
import { portfolioValuation } from './portfolioValuation';
import { buildStrategyStanding } from '../generators/strategyStanding';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function respond(label: string, build: () => JsonBodyType): Response {
  if (getActiveDeveloperScenario() === 'loading-error') {
    return failure(`Failed to load ${label}`, 500);
  }
  return HttpResponse.json(build(), { status: 200 });
}

export const partTwoReferenceHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/reference/inflation', () =>
    respond('inflation history', () => generateInflationHistory(today())),
  ),
  http.get('/api/v1/tax/loss-carry-forwards', () =>
    respond('losses carried forward', () =>
      generateLossCarryForwards(
        today(),
        residenceRules(currentTaxRuleSets())?.lossCarryForwardYears ?? undefined,
      ),
    ),
  ),
  http.get('/api/v1/counterparties', () =>
    respond('counterparties', () =>
      generateCounterparties(currentOperatingPolicy().counterpartyMaxSharePercent),
    ),
  ),
  http.get('/api/v1/risk/counterparty-exposure', () =>
    respond('counterparty exposure', () => {
      const { holdings, summary } = generatePortfolioData(tradingContext);
      return buildCounterpartyExposure({
        holdings,
        counterparties: generateCounterparties(
          currentOperatingPolicy().counterpartyMaxSharePercent,
        ),
        fxTable: generateCurrentFxRates(tradingContext).map((rate) => ({
          from: rate.from,
          to: rate.to,
          rate: new Decimal(rate.rate),
        })),
        currency: summary.totalValue.currency,
      });
    }),
  ),
  http.get('/api/v1/strategies/standing', () =>
    respond('strategy standing', () =>
      buildStrategyStanding(
        portfolioValuation(),
        generateStrategyLibrary(tradingContext),
        generateStrategyLifecycles(today()),
        today(),
      ),
    ),
  ),
  http.get('/api/v1/strategies/lifecycle', () =>
    respond('strategy lifecycles', () => generateStrategyLifecycles(today())),
  ),
];
