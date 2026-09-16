// Order history (UI spec 7.13). A raw order says what was asked for; the history entry says who
// carried it, what it actually cost, how far the fill drifted from the request, and everything that
// happened to it from signal to fill.

import { z } from 'zod';

import {
  InstrumentIdSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  QuantitySchema,
  StrategyIdSchema,
} from './common';
import { OrderSideSchema, OrderStatusSchema, OrderTypeSchema } from './trading';

export const OrderEventKindSchema = z.enum([
  'signal_raised',
  'approval_requested',
  'approved',
  'rejected',
  'submitted',
  'acknowledged',
  'partially_filled',
  'filled',
  'cancelled',
  'confirmation_lost',
]);
export type OrderEventKindDto = z.infer<typeof OrderEventKindSchema>;

export const OrderEventSchema = z.object({
  at: IsoUtcTimestampSchema,
  kind: OrderEventKindSchema,
  title: z.string().min(1),
  detail: z.string().min(1),
});
export type OrderEventDto = z.infer<typeof OrderEventSchema>;

export const OrderHistoryEntrySchema = z.object({
  orderId: z.string().min(1),
  signalId: z.string().nullable(),
  approvalId: z.string().nullable(),
  instrumentId: InstrumentIdSchema,
  instrumentSymbol: z.string().min(1),
  instrumentName: z.string().min(1),
  marketId: z.string().min(1),
  brokerId: z.string().min(1),
  brokerName: z.string().min(1),
  // Null strategy means the owner placed it by hand.
  strategyId: StrategyIdSchema.nullable(),
  strategyName: z.string().nullable(),
  side: OrderSideSchema,
  orderType: OrderTypeSchema,
  status: OrderStatusSchema,
  quantity: QuantitySchema,
  filledQuantity: QuantitySchema,
  requestedPrice: MoneySchema.nullable(),
  averageFilledPrice: MoneySchema.nullable(),
  // Filled minus requested, in basis points of the requested price. Positive means paid more
  // (or received less) than asked. Null until something has filled.
  slippageBps: z.number().nullable(),
  fees: MoneySchema.nullable(),
  createdAt: IsoUtcTimestampSchema,
  updatedAt: IsoUtcTimestampSchema,
  isSimulated: z.boolean(),
  // Set when the broker never acknowledged the order: nobody knows whether it is live.
  unconfirmedSince: IsoUtcTimestampSchema.nullable(),
  timeline: z.array(OrderEventSchema),
});
export type OrderHistoryEntryDto = z.infer<typeof OrderHistoryEntrySchema>;

export const OrderHistoryListSchema = z.array(OrderHistoryEntrySchema);
