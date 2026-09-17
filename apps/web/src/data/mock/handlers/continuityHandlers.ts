// MSW handlers for continuity, succession, nominee, and emergency access (requirements 28; UI spec 19.1).
// Writes update in-memory continuity state and return the updated view (decisions 33 and 37).

import { http, HttpResponse, type HttpHandler } from 'msw';

import { buildContinuityView, parseGenerated } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  confirmNomineeInStore,
  getContinuityStore,
  recordDrillInStore,
  resetHeartbeatInStore,
  updateInactivityInStore,
} from '../stores/continuityStore';
import {
  ContinuityViewSchema,
  RecordDrillRequestSchema,
  UpdateInactivityRequestSchema,
} from '../../schemas/continuity';
import { nowUtc } from '../../../shared/types/dateTime';
import { failure, firstIssue } from './versionedConfigHandlers';

function continuityResponse(): Response {
  const store = getContinuityStore();
  const today = new Date().toISOString().slice(0, 10);
  const now = nowUtc();
  const view = buildContinuityView({
    today,
    now,
    institutions: store.institutions,
    recoveryLocations: store.recoveryLocations,
    emergencyAccess: store.emergencyAccess,
    inactivityThresholdDays: store.inactivityThresholdDays,
    lastHeartbeatDate: store.lastHeartbeatDate,
  });
  return HttpResponse.json(parseGenerated(ContinuityViewSchema, view, 'continuity'), {
    status: 200,
  });
}

export const continuityHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/continuity', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load continuity and succession records', 500)
      : continuityResponse(),
  ),

  http.post('/api/v1/continuity/institutions/:id/confirm', ({ params }) => {
    const id = String(params['id']);
    confirmNomineeInStore(id, nowUtc());
    return continuityResponse();
  }),

  http.post('/api/v1/continuity/drill', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = RecordDrillRequestSchema.safeParse(body);
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    recordDrillInStore(parsed.data, nowUtc());
    return continuityResponse();
  }),

  http.put('/api/v1/continuity/inactivity', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = UpdateInactivityRequestSchema.safeParse(body);
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    updateInactivityInStore(parsed.data.thresholdDays);
    return continuityResponse();
  }),

  http.post('/api/v1/continuity/heartbeat', () => {
    const today = new Date().toISOString().slice(0, 10);
    resetHeartbeatInStore(today);
    return continuityResponse();
  }),
];
