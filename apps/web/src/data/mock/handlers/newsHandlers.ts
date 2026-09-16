// MSW request handlers for news items and economic calendar (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import { generateCalendarEvents, generateNewsItems } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

// The stale-data scenario holds the feed back three hours, past the news provider's 15 minutes.
const STALE_DELAY_MS = 3 * 3_600_000;
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

    const now = new Date(Date.now() - (scenario === 'stale-data' ? STALE_DELAY_MS : 0));
    let filtered = generateNewsItems(now);
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
