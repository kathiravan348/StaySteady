// Breach history (UI spec 7.14): cause, time, what was halted and how it resolved. Standing
// breaches are derived from limit usage rather than seeded, so a limit shown as exceeded on the
// panel always has its breach here, and it closes when the limit is no longer exceeded.

import type { z } from 'zod';

import type { ApprovalDto, OrderDto, RiskBreachDto, RiskLimitDto } from '../../schemas';
import { RiskBreachListSchema } from '../../schemas';
import { getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

type BreachInput = z.input<typeof RiskBreachListSchema>[number];

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

function describeUsage(limit: RiskLimitDto): string {
  const format = (value: number): string =>
    limit.unit === 'percent'
      ? `${value.toFixed(2)}%`
      : limit.unit === 'money'
        ? `${value.toFixed(2)} ${limit.currency ?? ''}`.trim()
        : String(value);
  const against = limit.direction === 'minimum' ? 'below the floor of' : 'against the limit of';
  return `${limit.measuredBy}, ${against} ${format(limit.threshold)}.`;
}

function haltedFor(limit: RiskLimitDto): string {
  if (limit.id === 'global-loss-weekly' || limit.id === 'global-loss-monthly') {
    return 'All automation stopped by the safety gate until the owner resumes it.';
  }
  return limit.consequence;
}

export interface RiskBreachInputs {
  readonly limits: readonly RiskLimitDto[];
  readonly orders: readonly OrderDto[];
  readonly approvals: readonly ApprovalDto[];
  // Breaches the owner closed by changing a limit, recorded when the change was made.
  readonly resolved: readonly RiskBreachDto[];
}

export function generateRiskBreaches(
  ctx: MockGeneratorContext,
  inputs: RiskBreachInputs,
): readonly RiskBreachDto[] {
  const reference = String(ctx.referenceTime);
  const referenceMs = new Date(reference).getTime();
  const at = (offsetMs: number): string => new Date(referenceMs + offsetMs).toISOString();

  const standing: BreachInput[] = inputs.limits
    .filter((limit) => limit.isBreached)
    .map((limit) => {
      // A sell already waiting for approval is the path out of a strategy's capital breach.
      const pendingSell = inputs.approvals.find((approval) => {
        const order = inputs.orders.find((item) => String(item.id) === String(approval.orderId));
        return (
          approval.status === 'pending' &&
          order?.side === 'sell' &&
          limit.id.startsWith(`strategy-${String(order.strategyId ?? '')}-`)
        );
      });
      return {
        id: `standing-${limit.id}`,
        limitId: limit.id,
        title: `${limit.name} exceeded${limit.group === 'global' ? '' : ` · ${limit.scopeLabel}`}`,
        severity: 'critical',
        cause: describeUsage(limit),
        startedAt: reference,
        endedAt: null,
        halted: haltedFor(limit),
        resolution:
          pendingSell === undefined
            ? 'Ongoing. Holdings have to fall back inside the limit, or the limit has to be changed.'
            : `Ongoing. A sell that would bring it back is waiting for approval (${pendingSell.id}).`,
      };
    });

  const unconfirmed: BreachInput[] = inputs.orders
    .filter((order) => order.status === 'unconfirmed')
    .map((order) => {
      const symbol =
        getInstrumentById(String(order.instrumentId))?.symbol ?? String(order.instrumentId);
      return {
        id: `unconfirmed-${String(order.id)}`,
        limitId: null,
        title: `Order not confirmed by the broker · ${symbol}`,
        severity: 'critical',
        cause: `Order ${String(order.id)} to ${order.side} ${String(order.quantity)} ${symbol} was never acknowledged, so nobody knows whether it is live.`,
        startedAt: String(order.createdAt),
        endedAt: null,
        halted: `Every new order in ${symbol}, so a second position cannot open by accident.`,
        resolution: 'Ongoing. Confirm with the broker whether the order exists.',
      };
    });

  // History the signals feed already implies: the bitcoin buy blocked nine hours before the reference
  // time was stopped by this daily loss breach.
  const history: BreachInput[] = [
    {
      id: 'history-daily-loss',
      limitId: 'global-loss-daily',
      title: 'Daily loss limit exceeded',
      severity: 'critical',
      cause: 'The portfolio fell 2.40% intraday against the daily loss limit of 2.00%.',
      startedAt: at(-9 * HOUR_MS),
      endedAt: at(-9 * HOUR_MS + 3 * HOUR_MS + 10 * MINUTE_MS),
      halted: 'New buying across every strategy. The BTCUSD channel breakout signal was blocked.',
      resolution:
        'Resolved on its own after 3h 10m, when the portfolio recovered above −2.00%. Buying resumed automatically.',
    },
    {
      id: 'history-orders-day',
      limitId: 'global-orders-day',
      title: 'Orders per day exceeded',
      severity: 'warning',
      cause:
        '22 orders were attempted in one session against the limit of 20 while TSLA whipsawed.',
      startedAt: at(-12 * DAY_MS + 14 * HOUR_MS),
      endedAt: at(-11 * DAY_MS),
      halted:
        'The last 2 orders were refused and RSI Oversold Mean Reversion paused for the session.',
      resolution:
        'Resolved when the limit reset at the next session. The owner reviewed it and kept 20.',
    },
  ];

  const all = [...standing, ...unconfirmed, ...inputs.resolved, ...history].sort((a, b) => {
    const aOpen = a.endedAt === null ? 1 : 0;
    const bOpen = b.endedAt === null ? 1 : 0;
    return bOpen - aOpen || String(b.startedAt).localeCompare(String(a.startedAt));
  });
  return parseGenerated(RiskBreachListSchema, all, 'RiskBreaches');
}
