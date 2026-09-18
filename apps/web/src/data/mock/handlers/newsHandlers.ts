// MSW request handlers for news items and economic calendar (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  createMockGeneratorContext,
  generateCalendarEvents,
  generateInstrumentFeed,
  generateNewsItems,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { getComplianceStoreView } from '../stores/complianceStore';

// The stale-data scenario holds the feed back three hours, past the news provider's 15 minutes.
const STALE_DELAY_MS = 3 * 3_600_000;
const calendar = generateCalendarEvents();
const ctx = createMockGeneratorContext();

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

  // Requirements 38: one instrument's news, filings, actions and events, with restriction windows
  // read from the compliance store so the feed agrees with /compliance.
  http.get('/api/v1/instruments/:id/feed', ({ params }) => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the instrument feed' }, { status: 500 });
    }
    const now = new Date(Date.now() - (scenario === 'stale-data' ? STALE_DELAY_MS : 0));
    const compliance = getComplianceStoreView();
    const feed = generateInstrumentFeed(ctx, String(params['id']), now, {
      policyEnabled: compliance.overview.employerPolicy.enabled,
      blackouts: compliance.blackoutWindows,
    });
    return feed === null
      ? HttpResponse.json({ error: 'Instrument not found' }, { status: 404 })
      : HttpResponse.json(feed);
  }),
];
