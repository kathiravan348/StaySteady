// Canonical instrument exports and quote generation (M-07).

import type { z } from 'zod';
import { Decimal } from 'decimal.js';
import type { MarketQuoteDto } from '../../schemas';
import { MarketQuoteSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { currencyDecimals } from './values';
import { CANONICAL_INSTRUMENTS } from './canonicalInstruments';

export {
  CANONICAL_INSTRUMENTS,
  CANONICAL_INSTRUMENTS_RAW,
  getCanonicalInstruments,
  getInstrumentById,
} from './canonicalInstruments';

// Generates baseline market quotes for all canonical instruments
export function generateInitialQuotes(ctx: MockGeneratorContext): readonly MarketQuoteDto[] {
  const quoteRandom = ctx.random.fork('quotes');
  const quotes: z.input<typeof MarketQuoteSchema>[] = CANONICAL_INSTRUMENTS.map((inst) => {
    const dec = currencyDecimals(inst.currency);
    const basePrice =
      inst.currency === 'JPY'
        ? quoteRandom.int(2000, 3500)
        : inst.currency === 'INR'
          ? quoteRandom.int(800, 3200)
          : inst.type === 'digital_asset'
            ? quoteRandom.int(60000, 70000)
            : inst.type === 'commodity'
              ? quoteRandom.int(2300, 2700)
              : quoteRandom.int(40, 550);

    const changePct = quoteRandom.float(-0.035, 0.035);
    const prevClose = new Decimal(basePrice);
    const change = prevClose.times(changePct).toDecimalPlaces(dec);
    const lastPrice = prevClose.plus(change);
    const spread = lastPrice.times(0.0008).toDecimalPlaces(dec);
    const bid = lastPrice.minus(spread);
    const ask = lastPrice.plus(spread);
    const isUp = change.isPositive() && !change.isZero();

    return {
      instrumentId: inst.id,
      lastPrice: { amount: lastPrice.toFixed(dec), currency: inst.currency },
      change: { amount: change.abs().toFixed(dec), currency: inst.currency },
      changePercent: Math.abs(changePct * 100),
      direction: change.isZero() ? 'neutral' : isUp ? 'positive' : 'negative',
      bid: { amount: bid.toFixed(dec), currency: inst.currency },
      ask: { amount: ask.toFixed(dec), currency: inst.currency },
      high: { amount: lastPrice.times(1.01).toFixed(dec), currency: inst.currency },
      low: { amount: lastPrice.times(0.99).toFixed(dec), currency: inst.currency },
      open: { amount: prevClose.times(1.002).toFixed(dec), currency: inst.currency },
      previousClose: { amount: prevClose.toFixed(dec), currency: inst.currency },
      volume: quoteRandom.int(50_000, 8_000_000),
      timestamp: ctx.referenceTime,
    };
  });

  return parseGeneratedList(MarketQuoteSchema, quotes, 'marketQuotes');
}
