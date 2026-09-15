// Simulated live price ticking engine (M-15).
// Ticks market quotes periodically with realistic micro-variations and publishes updates.

import type { z } from 'zod';
import { Decimal } from 'decimal.js';
import type { MarketQuoteDto } from '../../schemas';
import { MarketQuoteSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { SeededRandom } from './seededRandom';
import { currencyDecimals, signedChange } from './values';
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

    const currency = q.lastPrice.currency;
    const dec = currencyDecimals(currency);
    const lastDec = new Decimal(q.lastPrice.amount);
    const prevCloseDec = new Decimal(q.previousClose.amount);

    // Micro-shock of -0.25% to +0.25%, kept within ±10% of the previous close so live prices stay
    // close to the daily chart they started from.
    const shockPct = random.float(-0.0025, 0.0025);
    const newLast = Decimal.min(
      Decimal.max(lastDec.times(1 + shockPct), prevCloseDec.times(0.9)),
      prevCloseDec.times(1.1),
    ).toDecimalPlaces(dec);

    const spread = newLast.times(0.0006).toDecimalPlaces(dec);
    const bid = newLast.minus(spread);
    const ask = newLast.plus(spread);

    const highDec = Decimal.max(new Decimal(q.high.amount), newLast);
    const lowDec = Decimal.min(new Decimal(q.low.amount), newLast);
    const additionalVolume = random.int(10, 500);

    return {
      ...q,
      lastPrice: { amount: newLast.toFixed(dec), currency },
      ...signedChange(newLast, prevCloseDec, currency),
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
