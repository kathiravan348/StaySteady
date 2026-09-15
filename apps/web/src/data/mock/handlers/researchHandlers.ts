// MSW request handlers for research, backtests, and trades (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  createMockGeneratorContext,
  generateBacktestResults,
  generateBacktestTrades,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();
const backtests = generateBacktestResults(ctx);

export const researchHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/backtests', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load backtests' }, { status: 500 });
    }
    return HttpResponse.json(backtests, { status: 200 });
  }),

  http.get('/api/v1/backtests/:id', ({ params }) => {
    const bt = backtests.find((b) => b.id === params['id']);
    if (!bt) {
      return HttpResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }
    return HttpResponse.json(bt, { status: 200 });
  }),

  http.get('/api/v1/backtests/:id/trades', ({ params, request }) => {
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? parseInt(countParam, 10) : 160;
    const trades = generateBacktestTrades(ctx, params['id'] as string, count);
    return HttpResponse.json(trades, { status: 200 });
  }),
];
