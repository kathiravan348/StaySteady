// Market-derived screener factors (S-34; owner question 19). Price, daily change, RSI-14 and the
// distance from the 200-day average come from the same mock price history the charts use (decision
// 19): canonical instruments use their own series, other screener symbols a deterministic series of
// their own. P/E and dividend yield come from the fundamentals generator where it covers the
// instrument; P/B, ROE and market size stay as seeded reference figures.

import type { InstrumentDto } from '../../schemas';
import { relativeStrengthIndex, simpleMovingAverage } from '../../../shared/indicators/indicators';
import { toInstrumentId, toMarketId } from '../../../shared/types/identifiers';
import { toQuantity } from '../../../shared/types/quantities';
import { CANONICAL_INSTRUMENTS } from './canonicalInstruments';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { generateInstrumentFundamentals } from './researchData';
import type { ScreenerSeed } from './screenerSeeds';

const MARKET_BY_LISTING: Readonly<Record<string, string>> = {
  'us-nasdaq': 'US',
  'us-nyse': 'US',
  'in-nse': 'IN',
};

const round = (value: number, places: number): number => Number(value.toFixed(places));

function instrumentFor(seed: ScreenerSeed): InstrumentDto {
  const canonical = CANONICAL_INSTRUMENTS.find((item) => item.symbol === seed.symbol);
  if (canonical !== undefined) return canonical;
  return {
    id: toInstrumentId(`inst-scr-${seed.symbol.toLowerCase().replace(/[^a-z0-9]/g, '')}`),
    symbol: seed.symbol,
    name: seed.name,
    marketId: toMarketId(MARKET_BY_LISTING[seed.marketId] ?? 'US'),
    currency: seed.currency === 'INR' ? 'INR' : 'USD',
    type: seed.assetClass === 'ETF' ? 'etf' : 'long_term',
    lotSize: toQuantity(1),
    tickSize: '0.01',
    isFractionalAllowed: false,
    status: 'active',
  };
}

export function withMarketFactors(
  seeds: readonly ScreenerSeed[],
  ctx: MockGeneratorContext,
): ScreenerSeed[] {
  return seeds.map((seed) => {
    const instrument = instrumentFor(seed);
    const bars = generatePriceHistoryForInstrument(ctx, instrument);
    // Indicators work on plain number series; the price itself stays a decimal string.
    const closes = bars.map((bar) => Number(bar.close));
    const last = closes[closes.length - 1];
    const previous = closes[closes.length - 2];
    const rsi = relativeStrengthIndex(closes, 14).at(-1);
    const sma = simpleMovingAverage(closes, 200).at(-1);
    const fundamentals = generateInstrumentFundamentals(ctx, String(instrument.id));
    if (last === undefined) return seed;
    const lastBar = bars.at(-1);
    return {
      ...seed,
      price: lastBar?.close ?? seed.price,
      change24hPct:
        previous === undefined || previous === 0 ? 0 : round((last / previous - 1) * 100, 2),
      rsi14: rsi === null || rsi === undefined ? seed.rsi14 : round(rsi, 1),
      sma200DistancePct:
        sma === null || sma === undefined || sma === 0
          ? seed.sma200DistancePct
          : round((last / sma - 1) * 100, 1),
      peRatio: fundamentals?.priceToEarnings ?? seed.peRatio,
      dividendYieldPct: fundamentals?.dividendYieldPercent ?? seed.dividendYieldPct,
    };
  });
}
