// MSW request handlers for portfolio, holdings, and transactions (M-14, reworked session 19).

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  createMockGeneratorContext,
  generatePortfolioData,
  getCanonicalBrokers,
  liveTicker,
} from '../generators';
import type { PortfolioDataBundle } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();

// Holdings are valued at the live ticker's current quotes, the same prices /quotes returns.
function currentBundle(): PortfolioDataBundle {
  const isEmpty = getActiveDeveloperScenario() === 'empty-portfolio';
  const quotes = liveTicker.getQuotes();
  return generatePortfolioData(ctx, isEmpty, quotes.length > 0 ? quotes : undefined);
}

function failure(message: string): Response | null {
  return getActiveDeveloperScenario() === 'loading-error'
    ? HttpResponse.json({ error: message }, { status: 500 })
    : null;
}

export const portfolioHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/portfolio/summary', () => {
    return (
      failure('Failed to load portfolio summary') ??
      HttpResponse.json(currentBundle().summary, { status: 200 })
    );
  }),

  http.get('/api/v1/portfolio/holdings', () => {
    return (
      failure('Failed to load holdings') ??
      HttpResponse.json(currentBundle().holdings, { status: 200 })
    );
  }),

  http.get('/api/v1/brokers', () => {
    return (
      failure('Failed to load brokers') ?? HttpResponse.json(getCanonicalBrokers(), { status: 200 })
    );
  }),

  http.get('/api/v1/portfolio/transactions', () => {
    return (
      failure('Failed to load transactions') ??
      HttpResponse.json(currentBundle().transactions, { status: 200 })
    );
  }),
];
