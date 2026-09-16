// MSW request handlers for System Health (UI spec 7.15).
// Component checks, data freshness and alert channels come from the watchdog, which stays reachable
// when the application API fails (loading-error), so the screen can still say what is broken.
// Reliability history and incidents come from the application API and fail with it.

import { delay, http, HttpResponse, type HttpHandler } from 'msw';

import type { AlertChannelDto } from '../../schemas';
import { ReliabilityPeriodSchema } from '../../schemas';
import {
  createMockGeneratorContext,
  generateAlertChannels,
  generateComponentHealth,
  generateDataFreshness,
  generateIncidentHistory,
  generateSourceReliability,
  testAlertChannel,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';

const ctx = createMockGeneratorContext();
let alertChannels: AlertChannelDto[] | null = null;

function channels(): AlertChannelDto[] {
  if (alertChannels === null) alertChannels = [...generateAlertChannels(new Date())];
  return alertChannels;
}

function applicationApiFailure(message: string): Response | null {
  return getActiveDeveloperScenario() === 'loading-error'
    ? HttpResponse.json({ error: message }, { status: 500 })
    : null;
}

export const healthHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/system/components', () =>
    HttpResponse.json(generateComponentHealth(new Date(), getActiveDeveloperScenario())),
  ),

  http.get('/api/v1/system/freshness', () =>
    HttpResponse.json(generateDataFreshness(new Date(), getActiveDeveloperScenario())),
  ),

  http.get('/api/v1/system/alert-channels', () => HttpResponse.json(channels())),

  http.post('/api/v1/system/alert-channels/:id/test', async ({ params }) => {
    const id = String(params['id']);
    const channel = channels().find((item) => item.id === id);
    if (channel === undefined) {
      return HttpResponse.json({ error: 'Alert channel not found' }, { status: 404 });
    }
    await delay(600);
    alertChannels = channels().map((item) =>
      item.id === id ? testAlertChannel(item, new Date()) : item,
    );
    return HttpResponse.json(alertChannels);
  }),

  http.get('/api/v1/system/reliability', ({ request }) => {
    const failed = applicationApiFailure('Failed to load reliability history');
    if (failed !== null) return failed;
    const period = ReliabilityPeriodSchema.safeParse(
      new URL(request.url).searchParams.get('period') ?? '30d',
    );
    if (!period.success) {
      return HttpResponse.json({ error: 'Period must be 7d, 30d or 90d' }, { status: 400 });
    }
    return HttpResponse.json(
      generateSourceReliability(ctx, new Date(), period.data, getActiveDeveloperScenario()),
    );
  }),

  http.get('/api/v1/system/incidents', () => {
    const failed = applicationApiFailure('Failed to load incidents');
    if (failed !== null) return failed;
    return HttpResponse.json(generateIncidentHistory(new Date(), getActiveDeveloperScenario()));
  }),
];
