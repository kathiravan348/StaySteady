// MSW handlers for the decision journal (requirements 29; UI spec 19.1). Rebuilt on every request from
// the seeded history, the risk panel's limit changes and the approval queue's decisions, so a decision
// made on either screen appears here at once.

import { http, HttpResponse, type HttpHandler } from 'msw';

import { buildJournal, generateStrategies, journalSeeds, parseGenerated } from '../generators';
import type { JournalDecision } from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { getReviews, setReview } from '../stores/journalStore';
import { getPlan } from '../stores/planningStore';
import { getRiskChanges } from '../stores/riskStore';
import { decisions, getApprovals, getOrders, tradingContext } from '../stores/tradingStore';
import { JournalReviewRequestSchema, JournalSchema } from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';
import { portfolioValuation } from './portfolioValuation';
import { failure, firstIssue } from './versionedConfigHandlers';

function journal(): Response {
  const v = portfolioValuation();
  const today = new Date().toISOString().slice(0, 10);
  const strategies = generateStrategies(tradingContext);
  const decided = [...decisions].flatMap(([approvalId, record]): JournalDecision[] => {
    const approval = getApprovals().find((item) => item.id === approvalId);
    const order = getOrders().find((item) => item.id === approval?.orderId);
    if (order === undefined) return [];
    return [
      {
        id: `decision-${approvalId}`,
        at: String(record.decidedAt),
        status: record.status,
        reason: record.decisionReason,
        instrumentId: String(order.instrumentId),
        side: order.side,
        quantity: String(record.quantity ?? order.quantity),
        strategyName: strategies.find((strategy) => strategy.id === order.strategyId)?.name ?? null,
      },
    ];
  });
  const plan = getPlan().plan;
  const result = buildJournal({
    v,
    today,
    now: nowUtc(),
    seeds: journalSeeds(v, today),
    riskChanges: getRiskChanges(),
    decisions: decided,
    typeTargets: new Map(
      plan.targets
        .filter((target) => target.dimension === 'type')
        .map((target) => [target.key, target.targetPercent]),
    ),
    tolerancePercent: plan.tolerancePercent,
    reviews: getReviews(),
  });
  return HttpResponse.json(parseGenerated(JournalSchema, result, 'journal'), { status: 200 });
}

export const journalHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/journal', () =>
    getActiveDeveloperScenario() === 'loading-error'
      ? failure('Failed to load the decision journal', 500)
      : journal(),
  ),

  http.post('/api/v1/journal/:id/review', async ({ params, request }) => {
    const parsed = JournalReviewRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(firstIssue(parsed.error), 400);
    setReview(String(params['id']), { note: parsed.data.note, at: nowUtc() });
    return journal();
  }),
];
