// MSW handlers for independent reconciliation (E-05; UI spec 7.15 and 19.2). Reconciliation is part
// of the application, so it fails with the API in the loading-error scenario.

import { http, HttpResponse, type HttpHandler } from 'msw';

import { parseGenerated } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  reconciliationAccounts,
  resolveReconciliation,
  runReconciliation,
} from '../stores/reconciliationStore';
import {
  ReconciliationViewSchema,
  ResolveReconciliationRequestSchema,
} from '../../schemas/reconciliation';
import { nowUtc } from '../../../shared/types/dateTime';
import { failure, firstIssue } from './versionedConfigHandlers';

const view = (): Response =>
  HttpResponse.json(
    parseGenerated(ReconciliationViewSchema, reconciliationAccounts(), 'reconciliation'),
    {
      status: 200,
    },
  );

export const reconciliationHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/health/reconciliation', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load reconciliation status', 500)
      : view(),
  ),

  http.post('/api/v1/health/reconciliation/:brokerId/run', ({ params }) => {
    const brokerId = String(params['brokerId']);
    if (!runReconciliation(brokerId, nowUtc())) return failure('Account not found', 404);
    return view();
  }),

  // Resuming automation is always a deliberate act with a stated reason (requirements 28, 31).
  http.post('/api/v1/health/reconciliation/:brokerId/resolve', async ({ params, request }) => {
    const brokerId = String(params['brokerId']);
    const account = reconciliationAccounts().find((item) => item.brokerId === brokerId);
    if (account === undefined) return failure('Account not found', 404);
    if (!account.automationPaused) return failure('Nothing to resolve for this account', 409);
    const parsed = ResolveReconciliationRequestSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    resolveReconciliation(brokerId, parsed.data.reason, nowUtc());
    return view();
  }),
];
