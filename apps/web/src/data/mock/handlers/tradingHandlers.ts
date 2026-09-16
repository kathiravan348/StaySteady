// MSW request handlers for strategies, signals, orders, and approvals (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  createMockGeneratorContext,
  generateApprovals,
  generateOrders,
  generateSignals,
  generateStrategies,
  generateStrategyLibrary,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { nowUtc } from '../../../shared/types/dateTime';

const ctx = createMockGeneratorContext();
let currentApprovals = [...generateApprovals(ctx)];
const currentOrders = [...generateOrders(ctx)];

export const tradingHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/strategies', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load strategies' }, { status: 500 });
    }
    return HttpResponse.json(generateStrategies(ctx), { status: 200 });
  }),

  // Registered before /api/v1/strategies/:id would be, so the specific path wins.
  http.get('/api/v1/strategies/library', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the strategy library' }, { status: 500 });
    }
    return HttpResponse.json(generateStrategyLibrary(ctx, scenario === 'empty-portfolio'), {
      status: 200,
    });
  }),

  http.get('/api/v1/signals', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load signals' }, { status: 500 });
    }
    return HttpResponse.json(generateSignals(ctx), { status: 200 });
  }),

  http.get('/api/v1/orders', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }
    return HttpResponse.json(currentOrders, { status: 200 });
  }),

  http.get('/api/v1/approvals', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load approvals' }, { status: 500 });
    }
    return HttpResponse.json(currentApprovals, { status: 200 });
  }),

  http.post('/api/v1/approvals/:id/decide', async ({ params, request }) => {
    try {
      const body = (await request.json()) as { decision?: 'approved' | 'rejected' };
      const id = params['id'] as string;
      currentApprovals = currentApprovals.map((appr) => {
        if (appr.id === id) {
          return {
            ...appr,
            status: body.decision ?? 'approved',
            decidedAt: nowUtc(),
            decidedBy: 'owner',
          };
        }
        return appr;
      });
      return HttpResponse.json({ success: true, approvals: currentApprovals }, { status: 200 });
    } catch {
      return HttpResponse.json({ error: 'Invalid decision payload' }, { status: 400 });
    }
  }),
];
