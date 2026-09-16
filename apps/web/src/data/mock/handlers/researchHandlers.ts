// MSW request handlers for research: saved backtests, trades, backtest setup data and runs (M-14,
// UI spec 7.9). Specific paths come before /backtests/:id so "runs" is not read as an id.

import { http, HttpResponse, type HttpHandler } from 'msw';

import { BacktestConfigSchema } from '../../schemas';
import {
  createMockGeneratorContext,
  describeRun,
  generateBacktestDetail,
  generateBacktestResults,
  generateBacktestTrades,
  generateDataCoverage,
  generateMarketCostDefaults,
  type BacktestRunState,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();
const backtests = generateBacktestResults(ctx);
const runs = new Map<string, BacktestRunState>();

function failure(message: string): Response | null {
  return getActiveDeveloperScenario() === 'loading-error'
    ? HttpResponse.json({ error: message }, { status: 500 })
    : null;
}

const problem = (status: number, error: string): Response =>
  HttpResponse.json({ error }, { status });

export const researchHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/backtests/cost-defaults', () => {
    return (
      failure('Failed to load cost assumptions') ?? HttpResponse.json(generateMarketCostDefaults())
    );
  }),

  http.get('/api/v1/backtests/data-coverage', ({ request }) => {
    const failed = failure('Failed to load data coverage');
    if (failed !== null) return failed;
    const ids =
      new URL(request.url).searchParams.get('instrumentIds')?.split(',').filter(Boolean) ?? [];
    if (ids.length === 0) return problem(400, 'Pass at least one instrumentId');
    return HttpResponse.json(generateDataCoverage(ctx, ids));
  }),

  http.post('/api/v1/backtests/runs', async ({ request }) => {
    const failed = failure('Failed to start the backtest');
    if (failed !== null) return failed;
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    const parsed = BacktestConfigSchema.safeParse(body);
    if (!parsed.success) {
      return problem(400, parsed.error.issues[0]?.message ?? 'Invalid backtest configuration');
    }
    if (parsed.data.startDate >= parsed.data.endDate) {
      return problem(400, 'The start date must be before the end date');
    }
    const state: BacktestRunState = {
      id: `run-${crypto.randomUUID()}`,
      config: parsed.data,
      startedAtMs: Date.now(),
      cancelledAtMs: null,
    };
    runs.set(state.id, state);
    return HttpResponse.json(describeRun(state, new Date()), { status: 201 });
  }),

  http.get('/api/v1/backtests/runs/:id', ({ params }) => {
    const state = runs.get(String(params['id']));
    if (state === undefined) return problem(404, 'Backtest run not found');
    return HttpResponse.json(describeRun(state, new Date()));
  }),

  http.delete('/api/v1/backtests/runs/:id', ({ params }) => {
    const id = String(params['id']);
    const state = runs.get(id);
    if (state === undefined) return problem(404, 'Backtest run not found');
    const cancelled: BacktestRunState = {
      ...state,
      cancelledAtMs: state.cancelledAtMs ?? Date.now(),
    };
    runs.set(id, cancelled);
    return HttpResponse.json(describeRun(cancelled, new Date()));
  }),

  http.get('/api/v1/backtests', () => {
    return failure('Failed to load backtests') ?? HttpResponse.json(backtests);
  }),

  http.get('/api/v1/backtests/:id', ({ params }) => {
    const result = backtests.find((item) => item.id === params['id']);
    if (result === undefined) return problem(404, 'Backtest not found');
    return HttpResponse.json(result);
  }),

  http.get('/api/v1/backtests/:id/detail', ({ params }) => {
    const failed = failure('Failed to load backtest detail');
    if (failed !== null) return failed;
    const result = backtests.find((item) => item.id === params['id']);
    if (result === undefined) return problem(404, 'Backtest not found');
    return HttpResponse.json(generateBacktestDetail(ctx, result));
  }),

  http.get('/api/v1/backtests/:id/trades', ({ params, request }) => {
    const count = Number(new URL(request.url).searchParams.get('count') ?? '160');
    const trades = generateBacktestTrades(
      ctx,
      String(params['id']),
      Number.isFinite(count) && count > 0 ? Math.min(500, Math.round(count)) : 160,
    );
    return HttpResponse.json(trades);
  }),
];
