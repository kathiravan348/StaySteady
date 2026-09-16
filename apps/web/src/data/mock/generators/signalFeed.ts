// Signals feed (UI spec 7.12): every signal generated, including the ones the safety layer blocked.
// The canonical live signals come from generateSignals; the rest are the history around them, so
// the feed shows what actually happens to a signal rather than only the ones that worked.

import type { z } from 'zod';

import type { SignalFeedEntryDto, StrategyDto } from '../../schemas';
import { SignalFeedEntrySchema } from '../../schemas';
import { getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { generateSignals, generateStrategies } from './trading';
import { parseGeneratedList } from './validated';

type EntryInput = z.input<typeof SignalFeedEntrySchema>;

const HOUR_MS = 3_600_000;

// A strategy below semi-automatic never places a real order, so anything it proposes is simulated.
function isSimulatedStage(strategy: StrategyDto | undefined): boolean {
  return strategy === undefined
    ? true
    : strategy.stage !== 'semi_automatic' && strategy.stage !== 'fully_automatic';
}

interface ExtraSignal {
  readonly signalId: string;
  readonly strategyId: string;
  readonly instrumentId: string;
  readonly direction: 'buy' | 'sell';
  readonly quantity: number;
  readonly price: string;
  readonly currency: 'USD' | 'INR';
  readonly confidence: number;
  readonly rationale: string;
  readonly hoursAgo: number;
  readonly expiresInHours: number;
  readonly outcome: SignalFeedEntryDto['outcome'];
  readonly blockedBy: SignalFeedEntryDto['blockedBy'];
  readonly orderId: string | null;
  readonly approvalId: string | null;
}

// Blocked signals name the limit that stopped them, because "rejected" without a reason teaches
// the reader nothing (UI spec 7.12).
const EXTRA_SIGNALS: readonly ExtraSignal[] = [
  {
    signalId: 'sig-03-aapl-buy',
    strategyId: 'strat-trend-momentum',
    instrumentId: 'inst-us-aapl',
    direction: 'buy',
    quantity: 30,
    price: '188.40',
    currency: 'USD',
    confidence: 0.81,
    rationale: 'Price held above the 200-day average through the pullback.',
    hoursAgo: 3,
    expiresInHours: 9,
    outcome: 'awaiting_approval',
    blockedBy: null,
    orderId: 'ord-0003-pending',
    approvalId: 'appr-001-expiring',
  },
  {
    signalId: 'sig-04-tata-buy',
    strategyId: 'strat-rsi-reversion',
    instrumentId: 'inst-in-tatamotors',
    direction: 'buy',
    quantity: 60,
    price: '985.00',
    currency: 'INR',
    confidence: 0.68,
    rationale: 'RSI 14 fell to 26 with volume above its 20-day average.',
    hoursAgo: 2,
    expiresInHours: 4,
    outcome: 'awaiting_approval',
    blockedBy: null,
    orderId: 'ord-0006-pending',
    approvalId: 'appr-003-currency',
  },
  {
    signalId: 'sig-05-gold-sell',
    strategyId: 'strat-breakout-vol',
    instrumentId: 'inst-us-gold',
    direction: 'sell',
    quantity: 2,
    price: '1550.00',
    currency: 'USD',
    confidence: 0.77,
    rationale: 'Trailing stop breached 15% below the running peak.',
    hoursAgo: 1,
    expiresInHours: 30,
    outcome: 'awaiting_approval',
    blockedBy: null,
    orderId: 'ord-0007-pending',
    approvalId: 'appr-004-trailing',
  },
  {
    signalId: 'sig-06-nvda-buy',
    strategyId: 'strat-trend-momentum',
    instrumentId: 'inst-us-nvda',
    direction: 'buy',
    quantity: 120,
    price: '131.20',
    currency: 'USD',
    confidence: 0.85,
    rationale: 'Breakout above the prior quarter high on three times average volume.',
    hoursAgo: 6,
    expiresInHours: 6,
    outcome: 'blocked',
    blockedBy: {
      limitName: 'Maximum position size',
      detail:
        'The proposed 120 shares would be 16.1% of capital in one position, above the 15% limit.',
    },
    orderId: null,
    approvalId: null,
  },
  {
    signalId: 'sig-07-btc-buy',
    strategyId: 'strat-breakout-vol',
    instrumentId: 'inst-us-btc',
    direction: 'buy',
    quantity: 1,
    price: '61200.00',
    currency: 'USD',
    confidence: 0.63,
    rationale: 'Channel breakout with expanding true range.',
    hoursAgo: 9,
    expiresInHours: 3,
    outcome: 'blocked',
    blockedBy: {
      limitName: 'Daily loss limit',
      detail: 'The portfolio is down 2.4% today, past the 2% limit that pauses new buying.',
    },
    orderId: null,
    approvalId: null,
  },
  {
    signalId: 'sig-08-reliance-buy',
    strategyId: 'strat-rsi-reversion',
    instrumentId: 'inst-in-reliance',
    direction: 'buy',
    quantity: 10,
    price: '2900.00',
    currency: 'INR',
    confidence: 0.58,
    rationale: 'RSI 14 fell to 27 near the lower Bollinger band.',
    hoursAgo: 96,
    expiresInHours: -72,
    outcome: 'expired',
    blockedBy: null,
    orderId: 'ord-0005-cancelled',
    approvalId: null,
  },
];

function describe(instrumentId: string): { symbol: string; name: string; marketId: string } {
  const instrument = getInstrumentById(instrumentId);
  return {
    symbol: instrument?.symbol ?? instrumentId,
    name: instrument?.name ?? instrumentId,
    marketId: instrument === undefined ? 'unknown' : String(instrument.marketId),
  };
}

export function generateSignalFeed(ctx: MockGeneratorContext): readonly SignalFeedEntryDto[] {
  const strategies = generateStrategies(ctx);
  const byId = new Map(strategies.map((strategy) => [String(strategy.id), strategy]));
  const referenceMs = new Date(String(ctx.referenceTime)).getTime();

  // The two canonical live signals: the SPY one became the filled order, the other is still open.
  const live: EntryInput[] = generateSignals(ctx).map((signal) => {
    const strategy = byId.get(String(signal.strategyId));
    const instrument = describe(String(signal.instrumentId));
    const isSpy = String(signal.instrumentId) === 'inst-us-spy';
    return {
      signalId: signal.id,
      strategyId: signal.strategyId,
      strategyName: strategy?.name ?? String(signal.strategyId),
      instrumentId: signal.instrumentId,
      instrumentSymbol: instrument.symbol,
      instrumentName: instrument.name,
      marketId: instrument.marketId,
      direction: signal.direction,
      targetQuantity: signal.targetQuantity,
      targetPrice: signal.targetPrice ?? null,
      confidence: signal.confidence,
      rationale: signal.rationale,
      generatedAt: signal.generatedAt,
      expiresAt: signal.expiresAt,
      outcome: isSpy ? 'executed' : 'open',
      blockedBy: null,
      orderId: isSpy ? 'ord-0001-filled' : null,
      approvalId: null,
      isSimulated: isSimulatedStage(strategy),
    };
  });

  const extra: EntryInput[] = EXTRA_SIGNALS.map((item) => {
    const strategy = byId.get(item.strategyId);
    const instrument = describe(item.instrumentId);
    return {
      signalId: item.signalId,
      strategyId: item.strategyId,
      strategyName: strategy?.name ?? item.strategyId,
      instrumentId: item.instrumentId,
      instrumentSymbol: instrument.symbol,
      instrumentName: instrument.name,
      marketId: instrument.marketId,
      direction: item.direction,
      targetQuantity: item.quantity,
      targetPrice: { amount: item.price, currency: item.currency },
      confidence: item.confidence,
      rationale: item.rationale,
      generatedAt: new Date(referenceMs - item.hoursAgo * HOUR_MS).toISOString(),
      expiresAt: new Date(referenceMs + item.expiresInHours * HOUR_MS).toISOString(),
      outcome: item.outcome,
      blockedBy: item.blockedBy,
      orderId: item.orderId,
      approvalId: item.approvalId,
      isSimulated: isSimulatedStage(strategy),
    };
  });

  const entries = [...live, ...extra].sort((a, b) =>
    String(b.generatedAt).localeCompare(String(a.generatedAt)),
  );
  return parseGeneratedList(SignalFeedEntrySchema, entries, 'SignalFeedEntry');
}
