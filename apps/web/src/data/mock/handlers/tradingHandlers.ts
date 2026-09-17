// MSW request handlers for strategies, signals, orders, and approvals (M-14).

import { Decimal } from 'decimal.js';
import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  generateApprovalQueue,
  generateCurrentFxRates,
  generateOrderHistory,
  generateSignalFeed,
  generateSignals,
  generateStrategies,
  generateStrategyDraft,
  generateStrategyLibrary,
  generateStrategyVersions,
} from '../generators';
import { complianceFrom, refuseDecision, withSafeguards } from '../generators/approvalSafeguards';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import { currentOperatingPolicy } from '../stores/assumptionsStore';
import { evaluateEligibility } from '../stores/complianceStore';
import { isAutomationPausedFor } from '../stores/reconciliationStore';
import {
  decisions,
  getApprovals,
  getOrders,
  setApprovals,
  setOrders,
  tradingContext as ctx,
} from '../stores/tradingStore';
import { brokerFor } from '../generators/orderHistory';
import { getInstrumentById } from '../generators/instruments';
import type { ApprovalQueueItemDto, ApprovalRequestDto, OrderHistoryEntryDto } from '../../schemas';
import { ApprovalDecisionSchema } from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';
import { toQuantity } from '../../../shared/types/quantities';

// A broker whose positions do not match the depository statement has automation paused (decision 45),
// shown as a failed check on every approval routed to it.
function withReconciliation(item: ApprovalQueueItemDto): ApprovalQueueItemDto {
  const id = String(item.instrumentId);
  const broker = brokerFor(getInstrumentById(id), id);
  if (broker === undefined || !isAutomationPausedFor(String(broker.id))) return item;
  return {
    ...item,
    riskChecks: [
      {
        id: 'reconciliation',
        label: 'Broker reconciliation',
        status: 'failed',
        detail: `${broker.name} positions do not match the depository statement, so automation is paused until the mismatch is resolved on System health.`,
      },
      ...item.riskChecks,
    ],
  };
}

// Decisions are laid over the regenerated queue, then the safety layer's view is added: compliance
// from the compliance store, cooling off and the reason rule from the saved safeguards (E-03).
function decidedQueue(): readonly ApprovalRequestDto[] {
  const inputs = {
    checkEligibility: evaluateEligibility,
    safeguards: currentOperatingPolicy().safeguards,
    fxTable: generateCurrentFxRates(ctx).map((rate) => ({
      from: rate.from,
      to: rate.to,
      rate: new Decimal(rate.rate),
    })),
  };
  return generateApprovalQueue(ctx, getApprovals(), getOrders()).map((raw): ApprovalRequestDto => {
    const item = withReconciliation(raw);
    const decision = decisions.get(item.approvalId);
    if (decision === undefined) return withSafeguards(item, inputs, null);
    const decided = {
      ...item,
      status: decision.status,
      decidedAt: decision.decidedAt,
      decidedBy: 'owner',
      decisionReason: decision.decisionReason,
      quantity: decision.quantity === null ? item.quantity : toQuantity(decision.quantity),
      limitPrice:
        decision.limitPrice === null || item.limitPrice === null
          ? item.limitPrice
          : { ...item.limitPrice, amount: decision.limitPrice },
    };
    return withSafeguards(
      decided,
      inputs,
      decision.status === 'approved' ? { decidedAt: decision.decidedAt } : null,
    );
  });
}

const WORKING = new Set(['pending', 'partially_filled', 'unconfirmed']);

// Order history with the safety layer's current view of each working order (E-03).
function orderHistory(): readonly OrderHistoryEntryDto[] {
  const reasons = new Map([...decisions].map(([id, record]) => [id, record.decisionReason]));
  const cooling = new Map(
    decidedQueue().flatMap((item) => {
      const until = item.coolingOff?.executableAt ?? null;
      return item.status === 'approved' && until !== null && Date.parse(until) > Date.now()
        ? [[item.approvalId, until] as const]
        : [];
    }),
  );
  return generateOrderHistory(ctx, getOrders(), getApprovals(), reasons).map((entry) => ({
    ...entry,
    compliance: WORKING.has(entry.status)
      ? complianceFrom(
          evaluateEligibility(entry.instrumentSymbol, entry.side === 'buy' ? 'BUY' : 'SELL'),
        )
      : null,
    coolingOffUntil: entry.approvalId === null ? null : (cooling.get(entry.approvalId) ?? null),
  }));
}

export const tradingHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/strategies', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load strategies' }, { status: 500 });
    }
    return HttpResponse.json(generateStrategies(ctx), { status: 200 });
  }),

  // Registered before /api/v1/strategies/:id would be, so the specific path wins.
  http.get('/api/v1/strategies/library', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the strategy library' }, { status: 500 });
    }
    return HttpResponse.json(generateStrategyLibrary(ctx, scenario === 'empty-portfolio'), {
      status: 200,
    });
  }),

  http.get('/api/v1/strategies/:id/draft', ({ params }) => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the strategy' }, { status: 500 });
    }
    const draft = generateStrategyDraft(ctx, params['id'] as string);
    return draft === undefined
      ? HttpResponse.json({ error: 'Strategy not found' }, { status: 404 })
      : HttpResponse.json(draft, { status: 200 });
  }),

  http.get('/api/v1/strategies/:id/versions', ({ params }) => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load version history' }, { status: 500 });
    }
    return HttpResponse.json(generateStrategyVersions(ctx, params['id'] as string), {
      status: 200,
    });
  }),

  // Registered before /api/v1/signals, so the specific path wins.
  http.get('/api/v1/signals/feed', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the signals feed' }, { status: 500 });
    }
    return HttpResponse.json(generateSignalFeed(ctx), { status: 200 });
  }),

  http.get('/api/v1/signals', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load signals' }, { status: 500 });
    }
    return HttpResponse.json(generateSignals(ctx), { status: 200 });
  }),

  // Registered before /api/v1/orders, so the specific path wins. Built from the live stores, so a
  // decision made in the approval queue shows up in the order's timeline.
  http.get('/api/v1/orders/history', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load order history' }, { status: 500 });
    }
    return HttpResponse.json(orderHistory(), { status: 200 });
  }),

  http.get('/api/v1/orders', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }
    return HttpResponse.json(getOrders(), { status: 200 });
  }),

  // Registered before /api/v1/approvals, so the specific path wins.
  http.get('/api/v1/approvals/queue', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load the approval queue' }, { status: 500 });
    }
    return HttpResponse.json(decidedQueue(), { status: 200 });
  }),

  http.get('/api/v1/approvals', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load approvals' }, { status: 500 });
    }
    return HttpResponse.json(getApprovals(), { status: 200 });
  }),

  // Modifying is approving a changed order, so a modified quantity or price arrives with the
  // decision and the whole queue comes back (decision 33).
  http.post('/api/v1/approvals/:id/decide', async ({ params, request }) => {
    const id = params['id'] as string;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json({ error: 'Invalid decision payload' }, { status: 400 });
    }

    const parsed = ApprovalDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: `Invalid decision payload: ${parsed.error.issues[0]?.message ?? 'unknown'}` },
        { status: 400 },
      );
    }
    const current = decidedQueue().find((item) => item.approvalId === id);
    if (current === undefined) {
      return HttpResponse.json({ error: 'Approval not found' }, { status: 404 });
    }
    const reconciliationFailed = current.riskChecks.some(
      (check) => check.id === 'reconciliation' && check.status === 'failed',
    );
    if (parsed.data.decision === 'approved' && reconciliationFailed) {
      return HttpResponse.json(
        {
          error:
            'Automation is paused for this broker until its reconciliation mismatch is resolved',
        },
        { status: 409 },
      );
    }
    const refusal = refuseDecision(current, parsed.data, Date.now());
    if (refusal !== null) {
      return HttpResponse.json({ error: refusal.message }, { status: refusal.status });
    }

    const decidedAt = nowUtc();
    decisions.set(id, {
      status: parsed.data.decision,
      decidedAt,
      decisionReason: parsed.data.reason,
      quantity: parsed.data.modifiedQuantity,
      limitPrice: parsed.data.modifiedLimitPrice,
    });
    setApprovals(
      getApprovals().map((approval) =>
        approval.id === id
          ? { ...approval, status: parsed.data.decision, decidedAt, decidedBy: 'owner' }
          : approval,
      ),
    );
    // A rejected order was never sent, so the raw order record must say so too.
    if (parsed.data.decision === 'rejected') {
      const orderId = getApprovals().find((approval) => approval.id === id)?.orderId;
      setOrders(
        getOrders().map((order) =>
          String(order.id) === String(orderId ?? '')
            ? { ...order, status: 'rejected', updatedAt: decidedAt }
            : order,
        ),
      );
    }
    return HttpResponse.json(decidedQueue(), { status: 200 });
  }),
];
