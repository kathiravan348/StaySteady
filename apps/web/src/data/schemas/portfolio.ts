import { z } from 'zod';
import {
  BrokerIdSchema,
  DirectionSchema,
  InstrumentIdSchema,
  StrategyIdSchema,
  IsoDateSchema,
  IsoUtcTimestampSchema,
  MoneySchema,
  PercentageSchema,
  QuantitySchema,
} from './common';

export const LotSchema = z.object({
  id: z.string().min(1),
  holdingId: z.string().min(1),
  purchaseDate: IsoDateSchema,
  quantity: QuantitySchema,
  costPerUnit: MoneySchema,
  totalCost: MoneySchema,
});
export type LotDto = z.infer<typeof LotSchema>;

// Amounts are in the instrument's currency. unrealisedGainLoss and its percent are signed
// (negative for a loss); allocationPercent is the share of the portfolio in the base currency.
export const HoldingSchema = z.object({
  id: z.string().min(1),
  instrumentId: InstrumentIdSchema,
  brokerId: BrokerIdSchema,
  // Strategy that opened the position; absent for manually opened positions (UI spec 7.2).
  openedByStrategyId: StrategyIdSchema.optional(),
  quantity: QuantitySchema,
  costBasis: MoneySchema,
  currentPrice: MoneySchema,
  currentValue: MoneySchema,
  unrealisedGainLoss: MoneySchema,
  unrealisedGainLossPercent: PercentageSchema,
  direction: DirectionSchema,
  allocationPercent: PercentageSchema,
  // Protective exit price in the instrument's currency; absent when no exit is set.
  exitLevel: MoneySchema.optional(),
  lots: z.array(LotSchema),
});
export type HoldingDto = z.infer<typeof HoldingSchema>;

export const TransactionTypeSchema = z.enum([
  'buy',
  'sell',
  'dividend',
  'split',
  'fee',
  'deposit',
  'withdrawal',
]);
export type TransactionTypeDto = z.infer<typeof TransactionTypeSchema>;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  instrumentId: InstrumentIdSchema.optional(),
  type: TransactionTypeSchema,
  timestamp: IsoUtcTimestampSchema,
  quantity: QuantitySchema.optional(),
  unitPrice: MoneySchema.optional(),
  fees: MoneySchema,
  netAmount: MoneySchema,
  notes: z.string().optional(),
});
export type TransactionDto = z.infer<typeof TransactionSchema>;

export const PortfolioSummarySchema = z.object({
  totalValue: MoneySchema,
  costBasis: MoneySchema,
  unrealisedReturn: MoneySchema,
  unrealisedReturnPercent: PercentageSchema,
  direction: DirectionSchema,
  cashBalance: MoneySchema,
  activeHoldingsCount: z.number().int().nonnegative(),
  asOf: IsoUtcTimestampSchema,
});
export type PortfolioSummaryDto = z.infer<typeof PortfolioSummarySchema>;
