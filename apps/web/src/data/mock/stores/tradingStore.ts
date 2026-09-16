// In-memory order and approval state for the page load (decision 33), shared by the trading and
// risk handlers: an emergency cancel on the risk panel has to change the same orders the orders
// screen and approval queue read.

import type { ApprovalDto, OrderDto } from '../../schemas';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { createMockGeneratorContext, generateApprovals, generateOrders } from '../generators';

export const tradingContext = createMockGeneratorContext();

// Built on first use rather than at module evaluation: generating during evaluation depends on
// every module in the generator barrel already being initialised, which a circular import does not
// guarantee.
let approvals: ApprovalDto[] | null = null;
let orders: OrderDto[] | null = null;

export function getApprovals(): ApprovalDto[] {
  approvals ??= [...generateApprovals(tradingContext)];
  return approvals;
}

export function setApprovals(next: ApprovalDto[]): void {
  approvals = next;
}

export function getOrders(): OrderDto[] {
  orders ??= [...generateOrders(tradingContext)];
  return orders;
}

export function setOrders(next: OrderDto[]): void {
  orders = next;
}

export interface DecisionRecord {
  readonly status: 'approved' | 'rejected';
  readonly decidedAt: IsoUtcTimestamp;
  readonly decisionReason: string | null;
  readonly quantity: number | null;
  readonly limitPrice: string | null;
}

// The approval queue is regenerated per request, so without this a decided approval would come
// straight back as pending.
export const decisions = new Map<string, DecisionRecord>();
