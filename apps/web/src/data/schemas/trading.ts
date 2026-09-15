import { z } from 'zod';
import {
  InstrumentIdSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  OrderIdSchema,
  QuantitySchema,
  StrategyIdSchema,
} from './common';

export const SignalDirectionSchema = z.enum(['buy', 'sell', 'hold']);
export type SignalDirectionDto = z.infer<typeof SignalDirectionSchema>;

export const SignalSchema = z.object({
  id: z.string().min(1),
  strategyId: StrategyIdSchema,
  instrumentId: InstrumentIdSchema,
  direction: SignalDirectionSchema,
  targetQuantity: QuantitySchema,
  targetPrice: MoneySchema.optional(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  generatedAt: IsoUtcTimestampSchema,
  expiresAt: IsoUtcTimestampSchema,
});
export type SignalDto = z.infer<typeof SignalSchema>;

export const OrderSideSchema = z.enum(['buy', 'sell']);
export type OrderSideDto = z.infer<typeof OrderSideSchema>;

export const OrderTypeSchema = z.enum(['market', 'limit', 'stop', 'stop_limit']);
export type OrderTypeDto = z.infer<typeof OrderTypeSchema>;

// UI spec 7.13 — unconfirmed orders are the dangerous ones and must be representable.
export const OrderStatusSchema = z.enum([
  'pending',
  'partially_filled',
  'filled',
  'rejected',
  'cancelled',
  'unconfirmed',
]);
export type OrderStatusDto = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: OrderIdSchema,
  signalId: z.string().optional(),
  strategyId: StrategyIdSchema.optional(),
  instrumentId: InstrumentIdSchema,
  side: OrderSideSchema,
  type: OrderTypeSchema,
  quantity: QuantitySchema,
  filledQuantity: QuantitySchema,
  limitPrice: MoneySchema.optional(),
  stopPrice: MoneySchema.optional(),
  status: OrderStatusSchema,
  createdAt: IsoUtcTimestampSchema,
  updatedAt: IsoUtcTimestampSchema,
});
export type OrderDto = z.infer<typeof OrderSchema>;

export const ApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected', 'expired']);
export type ApprovalStatusDto = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalSchema = z.object({
  id: z.string().min(1),
  orderId: OrderIdSchema,
  reason: z.string().min(1),
  status: ApprovalStatusSchema,
  requestedAt: IsoUtcTimestampSchema,
  expiresAt: IsoUtcTimestampSchema,
  decidedAt: IsoUtcTimestampSchema.optional(),
  decidedBy: z.string().optional(),
});
export type ApprovalDto = z.infer<typeof ApprovalSchema>;
