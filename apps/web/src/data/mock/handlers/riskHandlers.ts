// MSW request handlers for the risk and safety panel (UI spec 7.14). Limits are measured against the
// shared order store, so an emergency cancel here changes what the orders screen and queue show.

import { http, HttpResponse, type HttpHandler } from 'msw';

import {
  generateRiskBreaches,
  generateRiskLimits,
  generateRiskPanel,
  getInstrumentById,
} from '../generators';
import { getActiveDeveloperScenario } from '../scenarios/scenarioContext';
import {
  getResolvedBreaches,
  getRiskChanges,
  getThresholdOverrides,
  recordResolvedBreach,
  recordRiskChange,
  setThreshold,
} from '../stores/riskStore';
import {
  getApprovals,
  getOrders,
  setApprovals,
  setOrders,
  tradingContext as ctx,
} from '../stores/tradingStore';
import type { RiskLimitDto } from '../../schemas';
import { EmergencyRequestSchema, LimitChangeRequestSchema } from '../../schemas';
import { nowUtc } from '../../../shared/types/dateTime';

let changeCounter = 0;
const nextChangeId = (): string => {
  changeCounter += 1;
  return `risk-change-${String(changeCounter)}`;
};

function isSafetyBreach(): boolean {
  return getActiveDeveloperScenario() === 'safety-breach';
}

function limits(): readonly RiskLimitDto[] {
  return generateRiskLimits(ctx, {
    orders: getOrders(),
    overrides: getThresholdOverrides(),
    isSafetyBreach: isSafetyBreach(),
  });
}

function panel(): ReturnType<typeof generateRiskPanel> {
  return generateRiskPanel(ctx, {
    orders: getOrders(),
    overrides: getThresholdOverrides(),
    isSafetyBreach: isSafetyBreach(),
    changes: getRiskChanges(),
    nowMs: Date.now(),
  });
}

function formatValue(limit: RiskLimitDto, value: number): string {
  if (limit.unit === 'percent') return `${value.toFixed(2)}%`;
  if (limit.unit === 'money') return `${value.toFixed(2)} ${limit.currency ?? ''}`.trim();
  if (limit.unit === 'minutes') return `${String(value)} minutes`;
  return String(value);
}

const failure = (message: string, status: number): Response =>
  HttpResponse.json({ error: message }, { status });

export const riskHandlers: readonly HttpHandler[] = [
  http.get('/api/v1/risk/panel', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load the risk panel', 500);
    }
    return HttpResponse.json(panel(), { status: 200 });
  }),

  http.get('/api/v1/risk/breaches', () => {
    if (getActiveDeveloperScenario() === 'loading-error') {
      return failure('Failed to load breach history', 500);
    }
    const breaches = generateRiskBreaches(ctx, {
      limits: limits(),
      orders: getOrders(),
      approvals: getApprovals(),
      resolved: getResolvedBreaches(),
    });
    return HttpResponse.json(breaches, { status: 200 });
  }),

  // A change is only applied with a reason, within the limit's bounds, and is always recorded.
  http.patch('/api/v1/risk/limits/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const parsed = LimitChangeRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message ?? 'Invalid limit change', 400);
    }
    const before = limits().find((item) => item.id === id);
    if (before === undefined) return failure('Limit not found', 404);
    if (!before.isEditable) return failure(`${before.name} cannot be changed yet`, 400);
    const { threshold, reason } = parsed.data;
    if (threshold < before.minimum || threshold > before.maximum) {
      return failure(
        `${before.name} must be between ${formatValue(before, before.minimum)} and ${formatValue(before, before.maximum)}`,
        400,
      );
    }
    if (threshold === before.threshold) {
      return failure(`${before.name} is already ${formatValue(before, threshold)}`, 400);
    }

    setThreshold(id, threshold);
    const after = limits().find((item) => item.id === id) ?? before;
    const now = nowUtc();
    const effect =
      before.isBreached && !after.isBreached
        ? ' This ended a standing breach.'
        : !before.isBreached && after.isBreached
          ? ' This puts the limit in breach immediately.'
          : '';
    recordRiskChange({
      id: nextChangeId(),
      at: now,
      kind: 'limit_changed',
      title: `${before.name} changed · ${before.scopeLabel}`,
      detail: `From ${formatValue(before, before.threshold)} to ${formatValue(before, threshold)}. Measured at the time: ${before.measuredBy}.${effect}`,
      reason,
    });
    if (before.isBreached && !after.isBreached) {
      recordResolvedBreach({
        id: `resolved-${id}-${String(changeCounter)}`,
        limitId: id,
        title: `${before.name} exceeded${before.group === 'global' ? '' : ` · ${before.scopeLabel}`}`,
        severity: 'critical',
        cause: `${before.measuredBy}, against the limit of ${formatValue(before, before.threshold)}.`,
        startedAt: ctx.referenceTime,
        endedAt: now,
        halted: before.consequence,
        resolution: `Resolved by the owner changing the limit to ${formatValue(before, threshold)}. Reason given: ${reason}`,
      });
    }
    return HttpResponse.json(panel(), { status: 200 });
  }),

  http.post('/api/v1/risk/emergency', async ({ request }) => {
    const parsed = EmergencyRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message ?? 'Invalid emergency action', 400);
    }
    const { action, reason } = parsed.data;
    const now = nowUtc();

    if (action === 'stop_automation' || action === 'resume_automation') {
      const isStop = action === 'stop_automation';
      recordRiskChange({
        id: nextChangeId(),
        at: now,
        kind: isStop ? 'automation_stopped' : 'automation_resumed',
        title: isStop ? 'All automation stopped' : 'Automation resumed',
        detail: isStop
          ? 'No strategy may raise or place orders until automation is resumed.'
          : 'Strategies may raise and place orders again, within their stages and limits.',
        reason,
      });
      return HttpResponse.json(panel(), { status: 200 });
    }

    // Working orders are cancelled. An unconfirmed order is left alone: it cannot be cancelled
    // until the broker says whether it exists.
    const working = getOrders().filter(
      (order) => order.status === 'pending' || order.status === 'partially_filled',
    );
    const workingIds = new Set(working.map((order) => String(order.id)));
    const unconfirmed = getOrders().filter((order) => order.status === 'unconfirmed').length;
    setOrders(
      getOrders().map((order) =>
        workingIds.has(String(order.id))
          ? { ...order, status: 'cancelled', updatedAt: now }
          : order,
      ),
    );
    setApprovals(
      getApprovals().map((approval) =>
        approval.status === 'pending' && workingIds.has(String(approval.orderId))
          ? { ...approval, status: 'expired', decidedAt: now, decidedBy: 'emergency control' }
          : approval,
      ),
    );
    const symbols = working.map(
      (order) =>
        getInstrumentById(String(order.instrumentId))?.symbol ?? String(order.instrumentId),
    );
    recordRiskChange({
      id: nextChangeId(),
      at: now,
      kind: 'orders_cancelled',
      title:
        working.length === 0
          ? 'No working orders to cancel'
          : `${String(working.length)} working order${working.length === 1 ? '' : 's'} cancelled`,
      detail: `${working.length === 0 ? 'Nothing was working.' : `Cancelled: ${symbols.join(', ')}.`}${
        unconfirmed > 0
          ? ` ${String(unconfirmed)} unconfirmed order${unconfirmed === 1 ? ' was' : 's were'} left, because an order cannot be cancelled until the broker confirms it exists.`
          : ''
      }`,
      reason,
    });
    return HttpResponse.json(panel(), { status: 200 });
  }),
];
