// Market-derived screener factors (S-34; owner question 19). Price, daily change, RSI-14 and the
// distance from the 200-day average come from the same mock price history the charts use (decision
// 19): canonical instruments use their own series, other screener symbols a deterministic series of
// their own. Where statements are collected, P/E, P/B, ROE and the statement factors (debt to
// equity, return on capital employed, three-year revenue growth, cash conversion) come from the
// shared measures (R-13; decision 53); dividend yield from the fundamentals generator; market size
// stays a seeded reference figure. A company without statements keeps its seeded P/E, P/B and ROE
// and has no statement factors at all.

import type { InstrumentDto } from '../../schemas';
import { relativeStrengthIndex, simpleMovingAverage } from '../../../shared/indicators/indicators';
import { toInstrumentId, toMarketId } from '../../../shared/types/identifiers';
import { toQuantity } from '../../../shared/types/quantities';
import { CANONICAL_INSTRUMENTS } from './canonicalInstruments';
import { classificationLabelForSymbol } from './classification';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { generateInstrumentFundamentals } from './researchData';
import { statementsForSymbol } from './financialStatements';
import { measuresFor } from './fundamentalMeasures';
import type { FactoredSeed, ScreenerSeed } from './screenerSeeds';

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

// The measures for the company on the consolidated basis, keyed by measure id.
function statementMeasures(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): ReadonlyMap<string, number | null> {
  const measures = measuresFor(ctx, instrument);
  return new Map((measures?.measures ?? []).map((measure) => [measure.id, measure.value]));
}

export function withMarketFactors(
  seeds: readonly ScreenerSeed[],
  ctx: MockGeneratorContext,
): FactoredSeed[] {
  return seeds.map((seed) => {
    // A company with statements prices off the series its statements were generated against, so
    // the screener's price, its P/E and the research screen's P/E all agree (decision 19).
    const instrument = statementsForSymbol(ctx, seed.symbol)?.instrument ?? instrumentFor(seed);
    // Sector comes from the one classification source (R-01, decision 49), never the seed's own
    // wording, so a row here and a row on Planning cannot name the same company differently.
    const sector = classificationLabelForSymbol(seed.symbol, seed.sector);
    const bars = generatePriceHistoryForInstrument(ctx, instrument);
    // Indicators work on plain number series; the price itself stays a decimal string.
    const closes = bars.map((bar) => Number(bar.close));
    const last = closes[closes.length - 1];
    const previous = closes[closes.length - 2];
    const rsi = relativeStrengthIndex(closes, 14).at(-1);
    const sma = simpleMovingAverage(closes, 200).at(-1);
    const fundamentals = generateInstrumentFundamentals(ctx, String(instrument.id));
    const measures = statementMeasures(ctx, instrument);
    // A measure the company has statements for wins; a seeded figure stands in only without them.
    const measured = (id: string, fallback: number | null): number | null =>
      measures.has(id) ? (measures.get(id) ?? null) : fallback;
    const statementFactors = {
      debtToEquity: measures.get('debt-to-equity') ?? null,
      rocePct: measures.get('return-on-capital') ?? null,
      revenueGrowth3yPct: measures.get('revenue-growth-3y') ?? null,
      cashConversionPct: measures.get('cash-conversion') ?? null,
    };
    if (last === undefined) return { ...seed, sector, ...statementFactors };
    const lastBar = bars.at(-1);
    return {
      ...seed,
      sector,
      price: lastBar?.close ?? seed.price,
      change24hPct:
        previous === undefined || previous === 0 ? 0 : round((last / previous - 1) * 100, 2),
      rsi14: rsi === null || rsi === undefined ? seed.rsi14 : round(rsi, 1),
      sma200DistancePct:
        sma === null || sma === undefined || sma === 0
          ? seed.sma200DistancePct
          : round((last / sma - 1) * 100, 1),
      peRatio: measured('price-to-earnings', seed.peRatio),
      pbRatio: measured('price-to-book', seed.pbRatio),
      roePct: measured('return-on-equity', seed.roePct),
      dividendYieldPct: fundamentals?.dividendYieldPercent ?? seed.dividendYieldPct,
      ...statementFactors,
    };
  });
}
