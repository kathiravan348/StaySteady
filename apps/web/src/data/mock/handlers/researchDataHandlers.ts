// MSW request handlers for instrument fundamentals and watchlists (UI spec 7.4, 7.5).

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  createMockGeneratorContext,
  generateInstrumentFundamentals,
  generateWatchlists,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();

function failure(message: string): Response | null {
  return getActiveDeveloperScenario() === 'loading-error'
    ? HttpResponse.json({ error: message }, { status: 500 })
    : null;
}

export const researchDataHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/watchlists', () => {
    return failure('Failed to load watchlists') ?? HttpResponse.json(generateWatchlists());
  }),

  http.get('/api/v1/instruments/:id/fundamentals', ({ params }) => {
    const fundamentals = generateInstrumentFundamentals(ctx, String(params['id']));
    if (fundamentals === null) {
      return HttpResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }
    return failure('Failed to load fundamentals') ?? HttpResponse.json(fundamentals);
  }),
];
