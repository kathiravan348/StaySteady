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
import type { DeveloperScenarioId } from '../scenarios/scenarioContext';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import type { MarketQuoteDto } from '../../schemas';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';

const ctx = createMockGeneratorContext();
const initialQuotes = generateInitialQuotes(ctx);
liveTicker.setQuotes(initialQuotes);

const STALE_QUOTE_AGE_MS = 20 * 60 * 1000;

// Live quotes are stamped with the response time; the stale-data scenario ages them so screens
// show their stale state (UI spec 10).
function withFreshness(quote: MarketQuoteDto, scenario: DeveloperScenarioId): MarketQuoteDto {
  const ageMs = scenario === 'stale-data' ? STALE_QUOTE_AGE_MS : 0;
  return { ...quote, timestamp: toIsoUtcTimestamp(new Date(Date.now() - ageMs)) };
}

export const marketHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/markets', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
    }
    // Market configuration is unchanged by the market-closed scenario; open/closed state is derived
    // from time (and the scenario) by the market status provider.
    return HttpResponse.json(getCanonicalMarkets(), { status: 200 });
  }),

  http.get('/api/v1/quotes', ({ request }) => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }
    const ids = new URL(request.url).searchParams.get('instrumentIds')?.split(',') ?? [];
    const quotes = liveTicker.getQuotes();
    const selected = ids.length > 0 ? quotes.filter((q) => ids.includes(q.instrumentId)) : quotes;
    return HttpResponse.json(
      selected.map((quote) => withFreshness(quote, scenario)),
      { status: 200 },
    );
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
    return HttpResponse.json(withFreshness(quote, getActiveDeveloperScenario()), { status: 200 });
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
