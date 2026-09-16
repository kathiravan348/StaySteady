// Strategies, signals, orders, and approval queue generator (M-12).
// Fulfills UI Spec 15 lifecycle stages, unconfirmed orders, and time-sensitive approvals.

import type { ApprovalDto, OrderDto, SignalDto, StrategyDto } from '../../schemas';
import { ApprovalSchema, OrderSchema, SignalSchema, StrategySchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { toInstrumentId, toOrderId, toStrategyId } from '../../../shared/types/identifiers';
import { toQuantity } from '../../../shared/types/quantities';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';

export function generateStrategies(ctx: MockGeneratorContext): readonly StrategyDto[] {
  const strategies: StrategyDto[] = [
    {
      id: toStrategyId('strat-trend-momentum'),
      name: 'Dual Moving Average Momentum',
      description: 'EMA 20/50 crossover with ATR volatility trailing stop.',
      version: '1.4.0',
      stage: 'fully_automatic',
      universe: [toInstrumentId('inst-us-spy'), toInstrumentId('inst-us-aapl')],
      timeframe: '1d',
      parameters: { fastPeriod: 20, slowPeriod: 50, atrStopMultiplier: 2.5 },
      createdAt: toIsoUtcTimestamp('2023-04-10T00:00:00Z'),
      updatedAt: ctx.referenceTime,
    },
    {
      id: toStrategyId('strat-rsi-reversion'),
      name: 'RSI Oversold Mean Reversion',
      description: 'Enters on 14-period RSI < 28 with volume confirmation.',
      version: '2.1.0',
      stage: 'semi_automatic',
      universe: [toInstrumentId('inst-us-tsla'), toInstrumentId('inst-in-tatamotors')],
      timeframe: '4h',
      parameters: { rsiPeriod: 14, oversoldThreshold: 28, profitTargetPct: 4.5 },
      createdAt: toIsoUtcTimestamp('2023-09-15T00:00:00Z'),
      updatedAt: ctx.referenceTime,
    },
    {
      id: toStrategyId('strat-breakout-vol'),
      name: 'Donchian Channel Breakout',
      description: '20-day high/low breakout with risk allocation sizing.',
      version: '1.0.2',
      stage: 'observation',
      universe: [toInstrumentId('inst-us-gold'), toInstrumentId('inst-us-btc')],
      timeframe: '1d',
      parameters: { channelLength: 20, maxRiskPerTradePct: 1.0 },
      createdAt: toIsoUtcTimestamp('2024-01-20T00:00:00Z'),
      updatedAt: ctx.referenceTime,
    },
    {
      id: toStrategyId('strat-earnings-breakout'),
      name: 'Post-Earnings Announcement Drift',
      description: 'Catalyst-driven post-earnings momentum model.',
      version: '0.9.0',
      stage: 'backtested',
      universe: [toInstrumentId('inst-us-nvda')],
      timeframe: '1d',
      parameters: { minEpsSurprisePct: 5.0, holdDays: 10 },
      createdAt: toIsoUtcTimestamp('2024-06-01T00:00:00Z'),
      updatedAt: ctx.referenceTime,
    },
    {
      id: toStrategyId('strat-macro-regime'),
      name: 'Yield Curve Macro Rotation',
      description: 'Rotates equity and bond exposure by 2Y/10Y spread regime.',
      version: '0.1.0',
      stage: 'draft',
      universe: [toInstrumentId('inst-us-spy'), toInstrumentId('inst-us-treasury')],
      timeframe: '1w',
      parameters: { inversionThresholdBps: 0 },
      createdAt: toIsoUtcTimestamp('2024-09-01T00:00:00Z'),
      updatedAt: ctx.referenceTime,
    },
  ];

  return parseGeneratedList(StrategySchema, strategies, 'strategies');
}

export function generateSignals(ctx: MockGeneratorContext): readonly SignalDto[] {
  const signals: SignalDto[] = [
    {
      id: 'sig-01-spy-buy',
      strategyId: toStrategyId('strat-trend-momentum'),
      instrumentId: toInstrumentId('inst-us-spy'),
      direction: 'buy',
      targetQuantity: toQuantity(25),
      targetPrice: { amount: '562.50', currency: 'USD' },
      confidence: 0.89,
      rationale: 'EMA 20 crossed above EMA 50 with rising daily volume.',
      generatedAt: ctx.referenceTime,
      expiresAt: toIsoUtcTimestamp('2026-09-17T20:00:00Z'),
    },
    {
      id: 'sig-02-tsla-sell',
      strategyId: toStrategyId('strat-rsi-reversion'),
      instrumentId: toInstrumentId('inst-us-tsla'),
      direction: 'sell',
      targetQuantity: toQuantity(40),
      targetPrice: { amount: '248.00', currency: 'USD' },
      confidence: 0.74,
      rationale: 'Hit profit target +4.5% from swing entry.',
      generatedAt: ctx.referenceTime,
      expiresAt: toIsoUtcTimestamp('2026-09-16T18:00:00Z'),
    },
  ];

  return parseGeneratedList(SignalSchema, signals, 'signals');
}

export function generateOrders(ctx: MockGeneratorContext): readonly OrderDto[] {
  const orders: OrderDto[] = [
    {
      id: toOrderId('ord-0001-filled'),
      strategyId: toStrategyId('strat-trend-momentum'),
      instrumentId: toInstrumentId('inst-us-spy'),
      side: 'buy',
      type: 'limit',
      quantity: toQuantity(25),
      filledQuantity: toQuantity(25),
      limitPrice: { amount: '560.00', currency: 'USD' },
      status: 'filled',
      createdAt: toIsoUtcTimestamp('2026-09-14T14:30:00Z'),
      updatedAt: toIsoUtcTimestamp('2026-09-14T14:32:00Z'),
    },
    {
      id: toOrderId('ord-0002-partial'),
      strategyId: toStrategyId('strat-rsi-reversion'),
      instrumentId: toInstrumentId('inst-us-tsla'),
      side: 'buy',
      type: 'limit',
      quantity: toQuantity(50),
      filledQuantity: toQuantity(20),
      limitPrice: { amount: '235.00', currency: 'USD' },
      status: 'partially_filled',
      createdAt: ctx.referenceTime,
      updatedAt: ctx.referenceTime,
    },
    {
      id: toOrderId('ord-0003-pending'),
      strategyId: toStrategyId('strat-trend-momentum'),
      instrumentId: toInstrumentId('inst-us-aapl'),
      side: 'buy',
      type: 'market',
      quantity: toQuantity(30),
      filledQuantity: toQuantity(0),
      status: 'pending',
      createdAt: ctx.referenceTime,
      updatedAt: ctx.referenceTime,
    },
    {
      id: toOrderId('ord-0004-unconfirmed'),
      instrumentId: toInstrumentId('inst-us-nvda'),
      side: 'sell',
      type: 'limit',
      quantity: toQuantity(15),
      filledQuantity: toQuantity(0),
      limitPrice: { amount: '135.00', currency: 'USD' },
      status: 'unconfirmed',
      createdAt: ctx.referenceTime,
      updatedAt: ctx.referenceTime,
    },
    {
      id: toOrderId('ord-0005-cancelled'),
      // Raised by the RSI strategy's sig-08 signal, as the signals feed and order timeline say.
      strategyId: toStrategyId('strat-rsi-reversion'),
      instrumentId: toInstrumentId('inst-in-reliance'),
      side: 'buy',
      type: 'limit',
      quantity: toQuantity(10),
      filledQuantity: toQuantity(0),
      limitPrice: { amount: '2900.00', currency: 'INR' },
      status: 'cancelled',
      createdAt: toIsoUtcTimestamp('2026-09-12T09:30:00Z'),
      updatedAt: toIsoUtcTimestamp('2026-09-12T15:30:00Z'),
    },
    // Session 31: two more orders awaiting approval, so the queue (UI spec 7.12) has enough to
    // decide on and bulk approval means something.
    {
      id: toOrderId('ord-0006-pending'),
      strategyId: toStrategyId('strat-rsi-reversion'),
      instrumentId: toInstrumentId('inst-in-tatamotors'),
      side: 'buy',
      type: 'limit',
      quantity: toQuantity(60),
      filledQuantity: toQuantity(0),
      limitPrice: { amount: '985.00', currency: 'INR' },
      status: 'pending',
      createdAt: ctx.referenceTime,
      updatedAt: ctx.referenceTime,
    },
    {
      id: toOrderId('ord-0007-pending'),
      strategyId: toStrategyId('strat-breakout-vol'),
      instrumentId: toInstrumentId('inst-us-gold'),
      side: 'sell',
      type: 'limit',
      quantity: toQuantity(2),
      filledQuantity: toQuantity(0),
      limitPrice: { amount: '1550.00', currency: 'USD' },
      status: 'pending',
      createdAt: ctx.referenceTime,
      updatedAt: ctx.referenceTime,
    },
  ];

  return parseGeneratedList(OrderSchema, orders, 'orders');
}

export function generateApprovals(ctx: MockGeneratorContext): readonly ApprovalDto[] {
  const approvals: ApprovalDto[] = [
    {
      id: 'appr-001-expiring',
      orderId: toOrderId('ord-0003-pending'),
      reason:
        'Adding to a position already near its single-position limit, so the strategy asks before buying more.',
      status: 'pending',
      requestedAt: ctx.referenceTime,
      expiresAt: toIsoUtcTimestamp('2026-09-15T18:00:00Z'),
    },
    {
      id: 'appr-002-approved',
      orderId: toOrderId('ord-0001-filled'),
      reason: 'Manual override to increase SPY target weight by 2%.',
      status: 'approved',
      requestedAt: toIsoUtcTimestamp('2026-09-14T14:15:00Z'),
      expiresAt: toIsoUtcTimestamp('2026-09-14T16:00:00Z'),
      decidedAt: toIsoUtcTimestamp('2026-09-14T14:25:00Z'),
      decidedBy: 'owner',
    },
    {
      id: 'appr-003-currency',
      orderId: toOrderId('ord-0006-pending'),
      reason: 'Buying in INR adds foreign currency exposure above the 5% unhedged threshold.',
      status: 'pending',
      requestedAt: ctx.referenceTime,
      expiresAt: toIsoUtcTimestamp('2026-09-16T11:30:00Z'),
    },
    {
      id: 'appr-004-trailing',
      orderId: toOrderId('ord-0007-pending'),
      reason: 'Gold position breached its 15% trailing stop; the strategy proposes closing half.',
      status: 'pending',
      requestedAt: ctx.referenceTime,
      expiresAt: toIsoUtcTimestamp('2026-09-18T20:00:00Z'),
    },
  ];

  return parseGeneratedList(ApprovalSchema, approvals, 'approvals');
}
