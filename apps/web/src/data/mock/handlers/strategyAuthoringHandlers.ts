// MSW handlers for creating and saving strategies (T-01, decision 56). Bodies are validated with the
// shared schemas (decision 33); the store decides identity, stage and version numbers.

import { http, HttpResponse, type HttpHandler } from 'msw';

import { generateStrategyTemplates } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { createStrategy, saveStrategy } from '../stores/strategyStore';
import { CreateStrategyRequestSchema, SaveStrategyRequestSchema } from '../../schemas';
import { failure, firstIssue } from './versionedConfigHandlers';

// The store answers a refusal as a sentence; a missing strategy is 404, anything else a conflict.
const refusal = (message: string): Response =>
  failure(
    message,
    message.startsWith('No strategy') || message.startsWith('No template') ? 404 : 409,
  );

export const strategyAuthoringHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/strategies/templates', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load the starter templates', 500);
    }
    return HttpResponse.json(generateStrategyTemplates(), { status: 200 });
  }),

  http.post('/api/v1/strategies', async ({ request }) => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('The strategy could not be created', 500);
    }
    const parsed = CreateStrategyRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const created = createStrategy(parsed.data);
    return typeof created === 'string'
      ? refusal(created)
      : HttpResponse.json(created, { status: 201 });
  }),

  http.put('/api/v1/strategies/:id/draft', async ({ params, request }) => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('The strategy could not be saved', 500);
    }
    const parsed = SaveStrategyRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    const saved = saveStrategy(String(params['id']), parsed.data.draft, parsed.data.summary);
    return typeof saved === 'string' ? refusal(saved) : HttpResponse.json(saved, { status: 200 });
  }),
];
