// MSW request handlers for strategies, signals, orders, and approvals (M-14).

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  createMockGeneratorContext,
  generateApprovalQueue,
  generateApprovals,
  generateOrderHistory,
  generateOrders,
  generateSignalFeed,
  generateSignals,
  generateStrategies,
  generateStrategyDraft,
  generateStrategyLibrary,
  generateStrategyVersions,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import type { ApprovalDto, ApprovalRequestDto, OrderDto } from '../../schemas';
import { ApprovalDecisionSchema } from '../../schemas';
import { nowUtc, type IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toQuantity } from '../../../shared/types/quantities';

const ctx = createMockGeneratorContext();

// Built on first use rather than at module evaluation. Generating during evaluation depends on
// every module in the generator barrel already being initialised, and through a circular import
// that is not guaranteed: the first request could see an undefined binding and fail.
let currentApprovals: ApprovalDto[] | null = null;
let currentOrders: OrderDto[] | null = null;

function approvalsStore(): ApprovalDto[] {
  currentApprovals ??= [...generateApprovals(ctx)];
  return currentApprovals;
}

function ordersStore(): OrderDto[] {
  currentOrders ??= [...generateOrders(ctx)];
  return currentOrders;
}

// Decisions live in memory for the page load (decision 33). The queue is regenerated per request,
// so without this a decided approval would come straight back as pending.
interface DecisionRecord {
  readonly status: 'approved' | 'rejected';
  readonly decidedAt: IsoUtcTimestamp;
  readonly decisionReason: string | null;
  readonly quantity: number | null;
  readonly limitPrice: string | null;
}
const decisions = new Map<string, DecisionRecord>();

function decidedQueue(): readonly ApprovalRequestDto[] {
  return generateApprovalQueue(ctx).map((item): ApprovalRequestDto => {
    const decision = decisions.get(item.approvalId);
    if (decision === undefined) return item;
    return {
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
  });
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
    const reasons = new Map([...decisions].map(([id, record]) => [id, record.decisionReason]));
    return HttpResponse.json(generateOrderHistory(ctx, ordersStore(), approvalsStore(), reasons), {
      status: 200,
    });
  }),

  http.get('/api/v1/orders', () => {
    const scenario = getActiveDeveloperScenario();
    if (scenario === 'loading-error') {
      return HttpResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }
    return HttpResponse.json(ordersStore(), { status: 200 });
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
    return HttpResponse.json(approvalsStore(), { status: 200 });
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
    if (!approvalsStore().some((approval) => approval.id === id)) {
      return HttpResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    const decidedAt = nowUtc();
    decisions.set(id, {
      status: parsed.data.decision,
      decidedAt,
      decisionReason: parsed.data.reason,
      quantity: parsed.data.modifiedQuantity,
      limitPrice: parsed.data.modifiedLimitPrice,
    });
    currentApprovals = approvalsStore().map((approval) =>
      approval.id === id
        ? { ...approval, status: parsed.data.decision, decidedAt, decidedBy: 'owner' }
        : approval,
    );
    // A rejected order was never sent, so the raw order record must say so too.
    if (parsed.data.decision === 'rejected') {
      const orderId = currentApprovals.find((approval) => approval.id === id)?.orderId;
      currentOrders = ordersStore().map((order) =>
        String(order.id) === String(orderId ?? '')
          ? { ...order, status: 'rejected', updatedAt: decidedAt }
          : order,
      );
    }
    return HttpResponse.json(decidedQueue(), { status: 200 });
  }),
];
