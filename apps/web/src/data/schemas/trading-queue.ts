// Signals feed and approval queue (UI spec 7.12). A raw signal says nothing about whether it was
// allowed through, and a raw approval says nothing about what it would cost or do to the portfolio,
// so both are served enriched.

import { z } from 'zod';

import {
  InstrumentIdSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  QuantitySchema,
  StrategyIdSchema,
} from './common';
import {
  ApprovalStatusSchema,
  OrderSideSchema,
  OrderTypeSchema,
  SignalDirectionSchema,
} from './trading';

// 'blocked' is separate from 'rejected': the safety layer stopped it, nobody decided against it.
export const SignalOutcomeSchema = z.enum([
  'open',
  'awaiting_approval',
  'executed',
  'blocked',
  'rejected',
  'expired',
]);
export type SignalOutcomeDto = z.infer<typeof SignalOutcomeSchema>;

export const BlockedLimitSchema = z.object({
  limitName: z.string().min(1),
  detail: z.string().min(1),
});
export type BlockedLimitDto = z.infer<typeof BlockedLimitSchema>;

export const SignalFeedEntrySchema = z.object({
  signalId: z.string().min(1),
  strategyId: StrategyIdSchema,
  strategyName: z.string().min(1),
  instrumentId: InstrumentIdSchema,
  instrumentSymbol: z.string().min(1),
  instrumentName: z.string().min(1),
  marketId: z.string().min(1),
  direction: SignalDirectionSchema,
  targetQuantity: QuantitySchema,
  targetPrice: MoneySchema.nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  generatedAt: IsoUtcTimestampSchema,
  expiresAt: IsoUtcTimestampSchema,
  outcome: SignalOutcomeSchema,
  // Only set when the safety layer blocked it, naming the limit that did so.
  blockedBy: BlockedLimitSchema.nullable(),
  orderId: z.string().nullable(),
  approvalId: z.string().nullable(),
  // Simulated actions never reach a broker. They must never be mistaken for real ones.
  isSimulated: z.boolean(),
});
export type SignalFeedEntryDto = z.infer<typeof SignalFeedEntrySchema>;

export const SignalFeedListSchema = z.array(SignalFeedEntrySchema);

export const RiskCheckStatusSchema = z.enum(['passed', 'warning', 'failed']);
export type RiskCheckStatusDto = z.infer<typeof RiskCheckStatusSchema>;

export const RiskCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: RiskCheckStatusSchema,
  detail: z.string().min(1),
});
export type RiskCheckDto = z.infer<typeof RiskCheckSchema>;

// What the portfolio looks like after the action, so a decision is made on consequences.
export const ApprovalImpactSchema = z.object({
  estimatedCost: MoneySchema,
  currentPrice: MoneySchema,
  positionValueBefore: MoneySchema,
  positionValueAfter: MoneySchema,
  allocationPercentBefore: z.number(),
  allocationPercentAfter: z.number(),
  cashBefore: MoneySchema,
  cashAfter: MoneySchema,
  strategyCapitalUsedPercent: z.number(),
  strategyCapitalLimitPercent: z.number(),
  openPositionsAfter: z.number().int().nonnegative(),
  maxConcurrentPositions: z.number().int().nonnegative(),
});
export type ApprovalImpactDto = z.infer<typeof ApprovalImpactSchema>;

export const ApprovalRequestSchema = z.object({
  approvalId: z.string().min(1),
  orderId: z.string().min(1),
  signalId: z.string().nullable(),
  instrumentId: InstrumentIdSchema,
  instrumentSymbol: z.string().min(1),
  instrumentName: z.string().min(1),
  marketId: z.string().min(1),
  strategyId: StrategyIdSchema.nullable(),
  strategyName: z.string().nullable(),
  side: OrderSideSchema,
  orderType: OrderTypeSchema,
  quantity: QuantitySchema,
  limitPrice: MoneySchema.nullable(),
  reason: z.string().min(1),
  status: ApprovalStatusSchema,
  requestedAt: IsoUtcTimestampSchema,
  expiresAt: IsoUtcTimestampSchema,
  decidedAt: IsoUtcTimestampSchema.nullable(),
  decidedBy: z.string().nullable(),
  decisionReason: z.string().nullable(),
  isSimulated: z.boolean(),
  riskChecks: z.array(RiskCheckSchema),
  impact: ApprovalImpactSchema,
});
export type ApprovalRequestDto = z.infer<typeof ApprovalRequestSchema>;

export const ApprovalQueueListSchema = z.array(ApprovalRequestSchema);

// Modifying is approving a changed order, so the change travels with the decision.
export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().nullable(),
  modifiedQuantity: z.number().positive().nullable(),
  modifiedLimitPrice: z.string().nullable(),
});
export type ApprovalDecisionDto = z.infer<typeof ApprovalDecisionSchema>;
