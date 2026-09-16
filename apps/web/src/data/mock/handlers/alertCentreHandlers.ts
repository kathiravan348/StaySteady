// MSW request handlers for the Alerts Centre (UI spec 7.19). State and notes live for the page load;
// escalation is recomputed on every read from the saved alert rules.

import { http, HttpResponse, type HttpHandler } from 'msw';

import { parseGeneratedList, seedAlertGroups, withEscalation } from '../generators';
import type { AlertGroupInput } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { currentConfigs, getAlertRuleVersions } from '../stores/configStore';
import { AlertActionRequestSchema, AlertGroupListSchema } from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

// Keyed by scenario so switching scenarios shows that scenario's alerts, and edits persist within it.
const stores = new Map<string, AlertGroupInput[]>();

function groups(): AlertGroupInput[] {
  const scenario = getActiveDeveloperScenario();
  let current = stores.get(scenario);
  if (current === undefined) {
    current = seedAlertGroups(scenario, Date.now());
    stores.set(scenario, current);
  }
  return current;
}

function listResponse(): Response {
  const rules = currentConfigs(getAlertRuleVersions());
  const nowMs = Date.now();
  const list = groups()
    .map((alert) => withEscalation(alert, rules, nowMs))
    .sort((a, b) => (b.occurrences[0] ?? '').localeCompare(a.occurrences[0] ?? ''));
  return HttpResponse.json(parseGeneratedList(AlertGroupListSchema.element, list, 'alertGroups'), {
    status: 200,
  });
}

export const alertCentreHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/alerts/centre', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load alerts', 500)
      : listResponse(),
  ),

  http.post('/api/v1/alerts/centre/:id/action', async ({ params, request }) => {
    const id = String(params['id']);
    const parsed = AlertActionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Invalid action', 400);
    const list = groups();
    const alert = list.find((item) => item.id === id);
    if (alert === undefined) return failure('Alert not found', 404);
    const { action } = parsed.data;
    if (alert.state === 'resolved') return failure('This alert is already resolved', 409);
    if (action === 'acknowledge' && alert.state === 'acknowledged') {
      return failure('This alert is already acknowledged', 409);
    }
    const note = parsed.data.note === null || parsed.data.note === '' ? null : parsed.data.note;
    const next: AlertGroupInput = {
      ...alert,
      state: action === 'acknowledge' ? 'acknowledged' : 'resolved',
      notes: [
        ...alert.notes,
        { at: nowUtc(), action: action === 'acknowledge' ? 'acknowledged' : 'resolved', note },
      ],
    };
    stores.set(
      getActiveDeveloperScenario(),
      list.map((item) => (item.id === id ? next : item)),
    );
    return listResponse();
  }),
];
