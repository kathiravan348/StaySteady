// Simulated live price ticking engine (M-15).
// Ticks market quotes periodically with realistic micro-variations and publishes updates.

import type { z } from 'zod';
import { Decimal } from 'decimal.js';
import type { MarketQuoteDto } from '../../schemas';
import { MarketQuoteSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { SeededRandom } from './seededRandom';
import { currencyDecimals } from './values';
import { nowUtc } from '../../../shared/types/dateTime';

export type QuoteTickListener = (updatedQuotes: readonly MarketQuoteDto[]) => void;

/**
 * Computes a deterministic or randomized micro-tick across a slice of active quotes.
 */
export function tickQuotes(
  quotes: readonly MarketQuoteDto[],
  random: SeededRandom,
): readonly MarketQuoteDto[] {
  const updated: z.input<typeof MarketQuoteSchema>[] = quotes.map((q) => {
    // 60% chance each quote ticks on any given cycle
    if (random.float(0, 1) > 0.6) {
      return q;
    }

    const dec = currencyDecimals(q.lastPrice.currency);
    const lastDec = new Decimal(q.lastPrice.amount);
    const prevCloseDec = new Decimal(q.previousClose.amount);

    // Micro-shock: -0.25% to +0.25%
    const shockPct = random.float(-0.0025, 0.0025);
    const newLast = lastDec.times(1 + shockPct).toDecimalPlaces(dec);

    const change = newLast.minus(prevCloseDec);
    const isUp = change.isPositive() && !change.isZero();
    const changePct = prevCloseDec.isZero()
      ? 0
      : Math.abs(change.dividedBy(prevCloseDec).times(100).toNumber());

    const spread = newLast.times(0.0006).toDecimalPlaces(dec);
    const bid = newLast.minus(spread);
    const ask = newLast.plus(spread);

    const highDec = Decimal.max(new Decimal(q.high.amount), newLast);
    const lowDec = Decimal.min(new Decimal(q.low.amount), newLast);
    const additionalVolume = random.int(10, 500);
    const direction: 'positive' | 'negative' | 'neutral' = change.isZero()
      ? 'neutral'
      : isUp
        ? 'positive'
        : 'negative';

    return {
      ...q,
      lastPrice: { amount: newLast.toFixed(dec), currency: q.lastPrice.currency },
      change: { amount: change.abs().toFixed(dec), currency: q.lastPrice.currency },
      changePercent: Math.round(changePct * 100) / 100,
      direction,
      bid: { amount: bid.toFixed(dec), currency: q.lastPrice.currency },
      ask: { amount: ask.toFixed(dec), currency: q.lastPrice.currency },
      high: { amount: highDec.toFixed(dec), currency: q.lastPrice.currency },
      low: { amount: lowDec.toFixed(dec), currency: q.lastPrice.currency },
      volume: q.volume + additionalVolume,
      timestamp: nowUtc(),
    };
  });

  return parseGeneratedList(MarketQuoteSchema, updated, 'tickedQuotes');
}

/**
 * Singleton LiveTickerService managing background price ticking and UI dispatch.
 */
class LiveTickerService {
  private activeQuotes: readonly MarketQuoteDto[] = [];
  private listeners = new Set<QuoteTickListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  public setQuotes(quotes: readonly MarketQuoteDto[]): void {
    this.activeQuotes = quotes;
    this.notify();
  }

  public getQuotes(): readonly MarketQuoteDto[] {
    return this.activeQuotes;
  }

  public subscribe(listener: QuoteTickListener): () => void {
    this.listeners.add(listener);
    listener(this.activeQuotes);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  public start(random: SeededRandom, intervalMs = 2500): void {
    if (this.isRunning || typeof window === 'undefined') {
      return;
    }
    this.isRunning = true;
    this.timer = setInterval(() => {
      if (this.activeQuotes.length > 0) {
        this.activeQuotes = tickQuotes(this.activeQuotes, random);
        this.notify();
      }
    }, intervalMs);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public isTicking(): boolean {
    return this.isRunning;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.activeQuotes);
    }
  }
}

export const liveTicker = new LiveTickerService();
