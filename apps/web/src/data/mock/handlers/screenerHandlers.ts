// MSW handlers for S-26 Markets Screener (UI spec 8.3; Open Question 11).

import { http, HttpResponse, type HttpHandler } from 'msw';

import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { executeScreenerSearch, SCREENER_PRESETS } from '../generators/screenerGenerator';
import { ScreenerFilterCriteriaSchema, ScreenerSearchResultSchema } from '../../schemas/screener';
import { failure } from './versionedConfigHandlers';

export const screenerHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/markets/screener/presets', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load screener strategy presets', 500);
    }
    return HttpResponse.json(SCREENER_PRESETS, { status: 200 });
  }),

  http.post('/api/v1/markets/screener/search', async ({ request }) => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to execute screener filter query', 500);
    }

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = ScreenerFilterCriteriaSchema.safeParse(body);
    const criteria = parsed.success ? parsed.data : ScreenerFilterCriteriaSchema.parse({});

    const result = executeScreenerSearch(criteria);
    const parsedResult = ScreenerSearchResultSchema.parse(result);

    return HttpResponse.json(parsedResult, { status: 200 });
  }),
];
