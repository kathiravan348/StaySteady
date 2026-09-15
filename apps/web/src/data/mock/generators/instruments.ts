// Canonical instrument exports and quote generation (M-07, reworked session 19).
// Quotes come from each instrument's own price history, so a quote, its chart and a holding agree.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { InstrumentDto, MarketQuoteDto } from '../../schemas';
import { MarketQuoteSchema } from '../../schemas';
import { CANONICAL_INSTRUMENTS } from './canonicalInstruments';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { MockDataError, parseGeneratedList } from './validated';
import { currencyDecimals, signedChange } from './values';

export {
  CANONICAL_INSTRUMENTS,
  CANONICAL_INSTRUMENTS_RAW,
  getCanonicalInstruments,
  getInstrumentById,
} from './canonicalInstruments';

const SPREAD_RATIO = 0.0008;

// Last price = latest daily close; change is measured against the previous close.
function quoteFromHistory(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): z.input<typeof MarketQuoteSchema> {
  const bars = generatePriceHistoryForInstrument(ctx, instrument);
  const last = bars[bars.length - 1];
  const previous = bars[bars.length - 2] ?? last;
  if (last === undefined || previous === undefined) {
    throw new MockDataError(`No price history to build a quote for ${instrument.id}`);
  }

  const { currency } = instrument;
  const decimals = currencyDecimals(currency);
  const money = (value: Decimal): { amount: string; currency: typeof currency } => ({
    amount: value.toFixed(decimals),
    currency,
  });
  const lastPrice = new Decimal(last.close);
  const previousClose = new Decimal(previous.close);
  const spread = lastPrice.times(SPREAD_RATIO).toDecimalPlaces(decimals);

  return {
    instrumentId: instrument.id,
    lastPrice: money(lastPrice),
    ...signedChange(lastPrice, previousClose, currency),
    bid: money(lastPrice.minus(spread)),
    ask: money(lastPrice.plus(spread)),
    high: money(new Decimal(last.high)),
    low: money(new Decimal(last.low)),
    open: money(new Decimal(last.open)),
    previousClose: money(previousClose),
    volume: last.volume,
    timestamp: last.timestamp,
  };
}

export function generateInitialQuotes(ctx: MockGeneratorContext): readonly MarketQuoteDto[] {
  const quotes = CANONICAL_INSTRUMENTS.map((instrument) => quoteFromHistory(ctx, instrument));
  return parseGeneratedList(MarketQuoteSchema, quotes, 'marketQuotes');
}
