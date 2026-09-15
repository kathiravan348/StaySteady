// MSW request handlers for portfolio, holdings, and transactions (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import { createMockGeneratorContext, generatePortfolioData } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();

export const portfolioHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/portfolio/summary', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load portfolio summary' }, { status: 500 });
    }
    const isEmpty = scenario === 'empty-portfolio';
    const bundle = generatePortfolioData(ctx, isEmpty);
    return HttpResponse.json(bundle.summary, { status: 200 });
  }),

  http.get('/api/v1/portfolio/holdings', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load holdings' }, { status: 500 });
    }
    const isEmpty = scenario === 'empty-portfolio';
    const bundle = generatePortfolioData(ctx, isEmpty);
    return HttpResponse.json(bundle.holdings, { status: 200 });
  }),

  http.get('/api/v1/portfolio/transactions', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
    }
    const isEmpty = scenario === 'empty-portfolio';
    const bundle = generatePortfolioData(ctx, isEmpty);
    return HttpResponse.json(bundle.transactions, { status: 200 });
  }),
];
