// The valuation context for reports and planning: the portfolio as the portfolio screens see it
// (same generator context and live quotes), with the saved market configuration and strategy names.

import {
  createMockGeneratorContext,
  createValuationContext,
  generatePortfolioData,
  generateStrategies,
  liveTicker,
} from '../generators';
import type { ValuationContext } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { currentConfigs, getMarketVersions } from '../stores/configStore';

const ctx = createMockGeneratorContext();

export function portfolioValuation(): ValuationContext {
  const quotes = liveTicker.getQuotes();
  const bundle = generatePortfolioData(
    ctx,
    getActiveDeveloperScenario() === 'empty-portfolio',
    quotes.length > 0 ? quotes : undefined,
  );
  const strategies = new Map(generateStrategies(ctx).map((item) => [String(item.id), item.name]));
  return createValuationContext(
    ctx,
    bundle.holdings,
    bundle.transactions,
    currentConfigs(getMarketVersions()),
    strategies,
  );
}
