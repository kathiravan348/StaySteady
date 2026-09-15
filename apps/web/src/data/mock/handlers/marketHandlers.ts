// MSW request handlers for markets, instruments, prices, intraday, and FX (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  createMockGeneratorContext,
  getCanonicalMarkets,
  getMarketById,
  getCanonicalInstruments,
  getInstrumentById,
  generateInitialQuotes,
  generatePriceHistoryForInstrument,
  generateIntradayBars,
  getCanonicalCorporateActions,
  getCorporateActionsForInstrument,
  generateCurrentFxRates,
  generateFxHistories,
  liveTicker,
} from '../generators';
import type { IntradayTimeframe } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();
const initialQuotes = generateInitialQuotes(ctx);
liveTicker.setQuotes(initialQuotes);

export const marketHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/markets', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
    }
    const markets = getCanonicalMarkets();
    if (scenario === 'market-closed') {
      // Simulate all markets closed
      return HttpResponse.json(
        markets.map((m) => ({ ...m, regularHours: [] })),
        { status: 200 },
      );
    }
    return HttpResponse.json(markets, { status: 200 });
  }),

  http.get('/api/v1/markets/:id', ({ params }) => {
    const market = getMarketById(params['id'] as string);
    if (!market) {
      return HttpResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    return HttpResponse.json(market, { status: 200 });
  }),

  http.get('/api/v1/instruments', ({ request }) => {
    const url = new URL(request.url);
    const marketId = url.searchParams.get('marketId');
    const type = url.searchParams.get('type');
    let instruments = getCanonicalInstruments();

    if (marketId) {
      instruments = instruments.filter((i) => i.marketId === marketId);
    }
    if (type) {
      instruments = instruments.filter((i) => i.type === type);
    }
    return HttpResponse.json(instruments, { status: 200 });
  }),

  http.get('/api/v1/instruments/:id', ({ params }) => {
    const inst = getInstrumentById(params['id'] as string);
    if (!inst) {
      return HttpResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }
    return HttpResponse.json(inst, { status: 200 });
  }),

  http.get('/api/v1/instruments/:id/quotes', ({ params }) => {
    const quotes = liveTicker.getQuotes();
    const quote = quotes.find((q) => q.instrumentId === params['id']);
    if (!quote) {
      return HttpResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    return HttpResponse.json(quote, { status: 200 });
  }),

  http.get('/api/v1/instruments/:id/prices', ({ params }) => {
    const inst = getInstrumentById(params['id'] as string);
    if (!inst) {
      return HttpResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }
    const bars = generatePriceHistoryForInstrument(ctx, inst);
    return HttpResponse.json(bars, { status: 200 });
  }),

  http.get('/api/v1/instruments/:id/intraday', ({ params, request }) => {
    const inst = getInstrumentById(params['id'] as string);
    if (!inst) {
      return HttpResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }
    const url = new URL(request.url);
    const tf = (url.searchParams.get('timeframe') as IntradayTimeframe) || '5m';
    const bars = generateIntradayBars(ctx, inst, { timeframe: tf });
    return HttpResponse.json(bars, { status: 200 });
  }),

  http.get('/api/v1/corporate-actions', ({ request }) => {
    const url = new URL(request.url);
    const instrumentId = url.searchParams.get('instrumentId');
    const actions = instrumentId
      ? getCorporateActionsForInstrument(instrumentId)
      : getCanonicalCorporateActions();
    return HttpResponse.json(actions, { status: 200 });
  }),

  http.get('/api/v1/fx/rates', () => {
    const rates = generateCurrentFxRates(ctx);
    return HttpResponse.json(rates, { status: 200 });
  }),

  http.get('/api/v1/fx/history', () => {
    const histories = generateFxHistories(ctx);
    return HttpResponse.json(histories, { status: 200 });
  }),
];
