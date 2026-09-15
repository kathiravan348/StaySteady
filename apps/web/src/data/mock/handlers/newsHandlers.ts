// MSW request handlers for news items and economic calendar (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  createMockGeneratorContext,
  generateCalendarEvents,
  generateNewsItems,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();
const news = generateNewsItems(ctx);
const calendar = generateCalendarEvents();

export const newsHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/news', ({ request }) => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load news' }, { status: 500 });
    }
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const instrumentId = url.searchParams.get('instrumentId');

    let filtered = news;
    if (category) {
      filtered = filtered.filter((n) => n.category === category);
    }
    if (instrumentId) {
      filtered = filtered.filter((n) => n.relatedInstruments.includes(instrumentId as never));
    }
    return HttpResponse.json(filtered, { status: 200 });
  }),

  http.get('/api/v1/calendar', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load calendar events' }, { status: 500 });
    }
    return HttpResponse.json(calendar, { status: 200 });
  }),
];
