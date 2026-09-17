// Seeded decision history for the journal (UI spec 19.4): manual trades and limit overrides with the
// reasons given at the time, including one clearly poor decision. That sale is dated from the price
// history — the day after the sharpest fall before the strongest recovery — so its outcome is real.

import { Decimal } from 'decimal.js';

import type { ValuationContext } from './reportValuation';
import { addDays } from './reportValuation';

export interface TradeSeed {
  readonly id: string;
  readonly kind: 'manual_trade';
  readonly daysAgo: number;
  readonly instrumentId: string;
  readonly side: 'buy' | 'sell';
  readonly quantity: string;
  readonly reason: string | null;
}

export interface OverrideSeed {
  readonly id: string;
  readonly kind: 'limit_override';
  readonly daysAgo: number;
  readonly limitName: string;
  readonly detail: string;
  // The trade the override made room for, measured like a buy.
  readonly instrumentId: string | null;
  readonly reason: string;
}

export type JournalSeed = TradeSeed | OverrideSeed;

const SPY = 'inst-us-spy';

export function portfolioValue(v: ValuationContext, date: string): Decimal {
  return v.holdings.reduce(
    (sum, holding) => sum.plus(v.holdingValue(holding, date, 'USD')),
    new Decimal(0),
  );
}

const change = (from: Decimal | null, to: Decimal | null): number =>
  from === null || to === null || from.isZero()
    ? 0
    : to.minus(from).dividedBy(from).times(100).toNumber();

// Days ago, between 100 and 170, where the portfolio fell hardest in the week before and SPY rose
// most in the month after.
function panicDay(v: ValuationContext, today: string): number {
  let best = 130;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let daysAgo = 100; daysAgo <= 170; daysAgo += 1) {
    const day = addDays(today, -daysAgo);
    const before = change(portfolioValue(v, addDays(day, -7)), portfolioValue(v, day));
    const after = change(v.close(SPY, day), v.close(SPY, addDays(day, 30)));
    const score = after - before;
    if (score > bestScore) {
      bestScore = score;
      best = daysAgo;
    }
  }
  return best;
}

export function journalSeeds(v: ValuationContext, today: string): readonly JournalSeed[] {
  const panic = panicDay(v, today);
  return [
    {
      id: 'journal-aapl-buy',
      kind: 'manual_trade',
      daysAgo: 190,
      instrumentId: 'inst-us-aapl',
      side: 'buy',
      quantity: '20',
      reason: 'Earnings beat and guidance raised; adding before the next product cycle.',
    },
    {
      id: 'journal-spy-panic-sell',
      kind: 'manual_trade',
      daysAgo: panic,
      instrumentId: SPY,
      side: 'sell',
      quantity: '15',
      reason: 'Market is falling hard. Getting out before it gets worse.',
    },
    {
      id: 'journal-reliance-sell',
      kind: 'manual_trade',
      daysAgo: panic - 2,
      instrumentId: 'inst-in-reliance',
      side: 'sell',
      quantity: '5',
      reason: 'Cutting everything that is down.',
    },
    {
      id: 'journal-override-instrument-1',
      kind: 'limit_override',
      daysAgo: 75,
      limitName: 'Maximum in any one instrument',
      detail: 'Raised from 10% to 15% of capital.',
      instrumentId: 'inst-us-gold',
      reason: 'Want room to add to gold while it is cheap.',
    },
    {
      id: 'journal-gold-buy',
      kind: 'manual_trade',
      daysAgo: 74,
      instrumentId: 'inst-us-gold',
      side: 'buy',
      quantity: '2',
      reason: 'Gold holds up when markets are uncertain.',
    },
    {
      id: 'journal-override-instrument-2',
      kind: 'limit_override',
      daysAgo: 58,
      limitName: 'Maximum in any one instrument',
      detail: 'Raised from 15% to 18% of capital.',
      instrumentId: 'inst-us-gold',
      reason: 'Just this once, to finish building the gold position.',
    },
    {
      id: 'journal-override-daily-loss',
      kind: 'limit_override',
      daysAgo: 30,
      limitName: 'Daily loss limit',
      detail: 'Raised from 2% to 3% for the day.',
      instrumentId: null,
      reason: 'Volatile day; I do not want automation halted over noise.',
    },
    {
      id: 'journal-btc-buy',
      kind: 'manual_trade',
      daysAgo: 20,
      instrumentId: 'inst-us-btc',
      side: 'buy',
      quantity: '0.01',
      reason: null,
    },
    {
      id: 'journal-azn-buy',
      kind: 'manual_trade',
      daysAgo: 5,
      instrumentId: 'inst-uk-azn',
      side: 'buy',
      quantity: '10',
      reason: 'Dividend yield looks attractive after the pullback.',
    },
  ];
}
