// MSW handlers for Compliance (requirements 27; UI spec 19.1).
// Writes update in-memory compliance state and return the updated view (decisions 33 and 37).

import { http, HttpResponse, type HttpHandler } from 'msw';

import { parseGenerated } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  addRestrictedInstrumentToStore,
  confirmPolicyReviewInStore,
  evaluateEligibility,
  getComplianceStoreView,
  removeRestrictedInstrumentFromStore,
} from '../stores/complianceStore';
import {
  AddRestrictedInstrumentInputSchema,
  ComplianceViewSchema,
  EligibilityCheckResultSchema,
} from '../../schemas/compliance';
import { failure, firstIssue } from './versionedConfigHandlers';

function complianceResponse(): Response {
  const view = getComplianceStoreView();
  return HttpResponse.json(parseGenerated(ComplianceViewSchema, view, 'compliance'), {
    status: 200,
  });
}

export const complianceHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/compliance', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load compliance configuration and policy restrictions', 500)
      : complianceResponse(),
  ),

  http.post('/api/v1/compliance/check', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      symbol?: unknown;
      action?: unknown;
    };
    const symbol = typeof body.symbol === 'string' ? body.symbol : '';
    const action = body.action === 'SELL' ? 'SELL' : 'BUY';

    if (!symbol) {
      return failure('Instrument symbol is required for compliance check', 400);
    }

    const result = evaluateEligibility(symbol, action);
    const parsed = EligibilityCheckResultSchema.parse(result);
    return HttpResponse.json(parsed, { status: 200 });
  }),

  http.post('/api/v1/compliance/restricted', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = AddRestrictedInstrumentInputSchema.safeParse(body);
    if (!parsed.success) {
      return failure(firstIssue(parsed.error), 400);
    }
    addRestrictedInstrumentToStore(parsed.data);
    return complianceResponse();
  }),

  http.delete('/api/v1/compliance/restricted/:id', ({ params }) => {
    const id = String(params['id']);
    removeRestrictedInstrumentFromStore(id);
    return complianceResponse();
  }),

  http.post('/api/v1/compliance/confirm-review', () => {
    confirmPolicyReviewInStore();
    return complianceResponse();
  }),
];
