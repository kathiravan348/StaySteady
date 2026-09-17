// Order history (UI spec 7.13). Each order is joined to its instrument, the broker that carried
// it, the strategy that raised it and the approval it went through, so fees, slippage and the
// lifecycle timeline follow from the same data the other screens show.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  ApprovalDto,
  BrokerDto,
  InstrumentDto,
  OrderDto,
  OrderEventDto,
  OrderHistoryItemDto,
  StrategyDto,
} from '../../schemas';
import { OrderHistoryItemSchema } from '../../schemas';
import { CANONICAL_BROKERS } from './brokers';
import { HOLDING_PROFILES } from './holdingProfiles';
import { getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { generateStrategies } from './trading';
import { parseGeneratedList } from './validated';

type EntryInput = z.input<typeof OrderHistoryItemSchema>;
type Currency = InstrumentDto['currency'];
type Money = { amount: string; currency: Currency };

const SECOND_MS = 1000;
const MINUTE_MS = 60_000;
// How long the execution layer waits for a broker acknowledgement before it stops trusting the
// order's state.
const CONFIRMATION_TIMEOUT_MS = 30 * SECOND_MS;

// Which signal raised each order, matching the signals feed.
const SIGNAL_BY_ORDER: Readonly<Record<string, string>> = {
  'ord-0001-filled': 'sig-01-spy-buy',
  'ord-0003-pending': 'sig-03-aapl-buy',
  'ord-0005-cancelled': 'sig-08-reliance-buy',
  'ord-0006-pending': 'sig-04-tata-buy',
  'ord-0007-pending': 'sig-05-gold-sell',
};

function isSimulatedStage(strategy: StrategyDto | undefined): boolean {
  return strategy === undefined
    ? false
    : strategy.stage !== 'semi_automatic' && strategy.stage !== 'fully_automatic';
}

// The broker that holds the instrument if it is held, otherwise the first broker serving its market.
function brokerFor(
  instrument: InstrumentDto | undefined,
  instrumentId: string,
): BrokerDto | undefined {
  const profileBroker = HOLDING_PROFILES[instrumentId]?.brokerId;
  const byProfile = CANONICAL_BROKERS.find((broker) => String(broker.id) === profileBroker);
  if (byProfile !== undefined) return byProfile;
  return CANONICAL_BROKERS.find(
    (broker) => instrument !== undefined && broker.marketIds.includes(instrument.marketId),
  );
}

// Fees as each broker actually charges them: a percentage with a floor, or a flat ticket.
function feeFor(
  broker: BrokerDto | undefined,
  fillValue: Decimal,
  currency: Currency,
): Money | null {
  if (broker === undefined || fillValue.isZero()) return null;
  const id = String(broker.id);
  const amount =
    id === 'brk-zerodha'
      ? new Decimal(20)
      : id === 'brk-hl'
        ? new Decimal('11.95')
        : id === 'brk-private-notes'
          ? new Decimal(0)
          : Decimal.max(fillValue.times('0.0005'), new Decimal(1));
  return { amount: amount.toFixed(2), currency };
}

function shift(base: string, ms: number): string {
  return new Date(new Date(base).getTime() + ms).toISOString();
}

interface Fill {
  readonly averageFilledPrice: Money | null;
  readonly slippageBps: number | null;
  readonly fillValue: Decimal;
}

// A limit buy tends to fill a touch inside its limit; a market order pays the spread. Positive
// slippage always means a worse outcome than requested, whichever side the order is.
function fillFor(
  order: OrderDto,
  requested: Decimal | null,
  currency: Currency,
  ctx: MockGeneratorContext,
): Fill {
  const filled = Number(order.filledQuantity);
  if (filled <= 0 || requested === null) {
    return { averageFilledPrice: null, slippageBps: null, fillValue: new Decimal(0) };
  }
  const stream = ctx.random.fork(`order-fill:${String(order.id)}`);
  const drift = order.type === 'market' ? stream.float(2, 12) : stream.float(-6, 2);
  const signed = order.side === 'buy' ? drift : -drift;
  const price = requested.times(new Decimal(1).plus(new Decimal(signed).dividedBy(10_000)));
  const slippage =
    order.side === 'buy'
      ? price.minus(requested).dividedBy(requested).times(10_000)
      : requested.minus(price).dividedBy(requested).times(10_000);
  return {
    averageFilledPrice: { amount: price.toFixed(2), currency },
    slippageBps: Number(slippage.toFixed(1)),
    fillValue: price.times(filled),
  };
}

interface TimelineInputs {
  readonly order: OrderDto;
  readonly status: OrderDto['status'];
  readonly signalId: string | null;
  readonly approval: ApprovalDto | undefined;
  // The owner's own words when deciding, which the approval record itself does not keep.
  readonly decisionReason: string | null;
  readonly broker: BrokerDto | undefined;
  readonly fill: Fill;
}

function timelineFor(inputs: TimelineInputs): OrderEventDto[] {
  const { order, status, signalId, approval, decisionReason, broker, fill } = inputs;
  const because = decisionReason === null ? '' : ` Reason given: ${decisionReason}`;
  const created = String(order.createdAt);
  const updated = String(order.updatedAt);
  const brokerName = broker?.name ?? 'the broker';
  const events: z.input<typeof OrderHistoryItemSchema>['timeline'] = [];

  if (signalId !== null) {
    events.push({
      at: shift(created, -2 * MINUTE_MS),
      kind: 'signal_raised',
      title: 'Signal raised',
      detail: `Signal ${signalId} proposed this order.`,
    });
  }
  if (approval !== undefined) {
    events.push({
      at: String(approval.requestedAt),
      kind: 'approval_requested',
      title: 'Approval requested',
      detail: approval.reason,
    });
    if (approval.status === 'approved' && approval.decidedAt !== undefined) {
      events.push({
        at: String(approval.decidedAt),
        kind: 'approved',
        title: 'Approved',
        detail: `Approved by ${approval.decidedBy ?? 'owner'}.${because}`,
      });
    }
    if (approval.status === 'rejected') {
      events.push({
        at: String(approval.decidedAt ?? updated),
        kind: 'rejected',
        title: 'Rejected',
        detail: `Rejected by ${approval.decidedBy ?? 'owner'}. The order was never sent.${because}`,
      });
      return events.map((event) => event as OrderEventDto);
    }
  }
  if (approval?.status === 'pending') {
    return events.map((event) => event as OrderEventDto);
  }
  // Withdrawn before a decision, by the emergency cancel on the risk panel.
  if (approval?.status === 'expired') {
    events.push({
      at: String(approval.decidedAt ?? updated),
      kind: 'cancelled',
      title: 'Withdrawn',
      detail: 'Cancelled by an emergency control while still awaiting approval. It was never sent.',
    });
    return events.map((event) => event as OrderEventDto);
  }

  events.push({
    at: created,
    kind: 'submitted',
    title: 'Submitted',
    detail: `Sent to ${brokerName}.`,
  });

  if (status === 'unconfirmed') {
    events.push({
      at: shift(created, CONFIRMATION_TIMEOUT_MS),
      kind: 'confirmation_lost',
      title: 'No acknowledgement',
      detail: `${brokerName} did not acknowledge within 30 seconds. The order may or may not be live; check with the broker before doing anything else with this instrument.`,
    });
    return events.map((event) => event as OrderEventDto);
  }

  events.push({
    at: shift(created, 5 * SECOND_MS),
    kind: 'acknowledged',
    title: 'Acknowledged',
    detail: `${brokerName} accepted the order and is working it.`,
  });

  if (status === 'partially_filled') {
    events.push({
      at: shift(created, 40 * SECOND_MS),
      kind: 'partially_filled',
      title: 'Partly filled',
      detail: `${String(order.filledQuantity)} of ${String(order.quantity)} filled at ${fill.averageFilledPrice?.amount ?? '?'}; the rest is still working.`,
    });
  } else if (status === 'filled') {
    events.push({
      at: updated,
      kind: 'filled',
      title: 'Filled',
      detail: `${String(order.quantity)} filled at an average of ${fill.averageFilledPrice?.amount ?? '?'}.`,
    });
  } else if (status === 'cancelled') {
    events.push({
      at: updated,
      kind: 'cancelled',
      title: 'Cancelled',
      detail: 'Cancelled before any fill. Nothing was bought or sold.',
    });
  }
  return events.map((event) => event as OrderEventDto);
}

export function generateOrderHistory(
  ctx: MockGeneratorContext,
  orders: readonly OrderDto[],
  approvals: readonly ApprovalDto[],
  // Reasons recorded with each decision, keyed by approval id.
  decisionReasons: ReadonlyMap<string, string | null> = new Map(),
): readonly OrderHistoryItemDto[] {
  const strategies = generateStrategies(ctx);

  const entries = orders.map((order): EntryInput => {
    const instrumentId = String(order.instrumentId);
    const instrument = getInstrumentById(instrumentId);
    const broker = brokerFor(instrument, instrumentId);
    const strategy = strategies.find((item) => String(item.id) === String(order.strategyId ?? ''));
    const approval = approvals.find((item) => String(item.orderId) === String(order.id));
    const currency: Currency = order.limitPrice?.currency ?? instrument?.currency ?? 'USD';
    const requested = order.limitPrice?.amount ?? order.stopPrice?.amount ?? null;
    const requestedDecimal = requested === null ? null : new Decimal(requested);
    // A rejected approval means the order was never sent, whatever the raw record says.
    const status = approval?.status === 'rejected' ? 'rejected' : order.status;
    const fill = fillFor(order, requestedDecimal, currency, ctx);
    const signalId = SIGNAL_BY_ORDER[String(order.id)] ?? null;

    return {
      orderId: String(order.id),
      signalId,
      approvalId: approval?.id ?? null,
      instrumentId: order.instrumentId,
      instrumentSymbol: instrument?.symbol ?? instrumentId,
      instrumentName: instrument?.name ?? instrumentId,
      marketId: instrument === undefined ? 'unknown' : String(instrument.marketId),
      brokerId: broker === undefined ? 'unknown' : String(broker.id),
      brokerName: broker?.name ?? 'Unknown broker',
      strategyId: order.strategyId ?? null,
      strategyName: strategy?.name ?? null,
      side: order.side,
      orderType: order.type,
      status,
      quantity: order.quantity,
      filledQuantity: order.filledQuantity,
      requestedPrice: requested === null ? null : { amount: requested, currency },
      averageFilledPrice: fill.averageFilledPrice,
      slippageBps: fill.slippageBps,
      fees: feeFor(broker, fill.fillValue, currency),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isSimulated: isSimulatedStage(strategy),
      unconfirmedSince: status === 'unconfirmed' ? order.createdAt : null,
      timeline: timelineFor({
        order,
        status,
        signalId,
        approval,
        decisionReason: approval === undefined ? null : (decisionReasons.get(approval.id) ?? null),
        broker,
        fill,
      }),
    };
  });

  return parseGeneratedList(OrderHistoryItemSchema, entries, 'OrderHistoryEntry');
}
