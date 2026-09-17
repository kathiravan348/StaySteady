// Instrument fundamentals and watchlists (UI spec 7.4 right panel, 7.5). Deterministic per seed.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { InstrumentDto, InstrumentFundamentalsDto, WatchlistDto } from '../../schemas';
import { InstrumentFundamentalsSchema, WatchlistSchema } from '../../schemas';
import { sectorNameForSymbol } from './classification';
import { INDUSTRY_BY_SYMBOL } from './classificationAssignments';
import { CANONICAL_INSTRUMENTS, getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated, parseGeneratedList } from './validated';
import { currencyDecimals } from './values';

type FundamentalsInput = z.input<typeof InstrumentFundamentalsSchema>;

// Sector per symbol, derived from the one classification source (R-01, decision 49) rather than a
// second table of its own. Exported for planning's sector allocation (session 43); only a company
// instrument has a sector, so funds, commodities and currencies are absent by design.
export const SECTORS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.keys(INDUSTRY_BY_SYMBOL).flatMap((symbol) => {
    const sector = sectorNameForSymbol(symbol);
    return sector === null ? [] : [[symbol, sector] as const];
  }),
);

const EQUITY_TYPES = new Set<InstrumentDto['type']>(['intraday', 'swing', 'long_term', 'ipo']);
const FUND_TYPES = new Set<InstrumentDto['type']>(['etf', 'mutual_fund']);

const EMPTY: Omit<FundamentalsInput, 'instrumentId' | 'note'> = {
  sector: null,
  marketCap: null,
  priceToEarnings: null,
  dividendYieldPercent: null,
  beta: null,
  expenseRatioPercent: null,
  couponPercent: null,
  maturityDate: null,
};

const round = (value: number, places: number): number => Number(value.toFixed(places));

function fundamentalsFor(ctx: MockGeneratorContext, instrument: InstrumentDto): FundamentalsInput {
  const stream = ctx.random.fork(`fundamentals:${instrument.id}`);
  const base = { ...EMPTY, instrumentId: instrument.id };
  if (EQUITY_TYPES.has(instrument.type)) {
    const capital = new Decimal(stream.float(5, 3000)).times('1e9');
    return {
      ...base,
      sector: sectorNameForSymbol(instrument.symbol),
      marketCap: {
        amount: capital.toFixed(currencyDecimals(instrument.currency)),
        currency: instrument.currency,
      },
      priceToEarnings: round(stream.float(8, 45), 1),
      dividendYieldPercent: round(stream.float(0, 3.5), 2),
      beta: round(stream.float(0.6, 1.6), 2),
      note: 'Company figures are trailing twelve months. Mock data.',
    };
  }
  if (FUND_TYPES.has(instrument.type)) {
    return {
      ...base,
      expenseRatioPercent: round(stream.float(0.03, 0.9), 2),
      dividendYieldPercent: round(stream.float(0.8, 2.5), 2),
      beta: round(stream.float(0.9, 1.1), 2),
      note: 'Fund figures: yearly expense ratio and trailing distribution yield. Mock data.',
    };
  }
  if (instrument.type === 'bond') {
    const years = stream.int(2, 12);
    const maturity = new Date(ctx.referenceTime);
    maturity.setUTCFullYear(maturity.getUTCFullYear() + years);
    return {
      ...base,
      couponPercent: round(stream.float(3, 9), 2),
      maturityDate: maturity.toISOString().slice(0, 10),
      note: 'Bond figures: annual coupon and final maturity. Mock data.',
    };
  }
  return {
    ...base,
    note: `No company or fund fundamentals apply to ${instrument.type.replaceAll('_', ' ')} instruments.`,
  };
}

export function generateInstrumentFundamentals(
  ctx: MockGeneratorContext,
  instrumentId: string,
): InstrumentFundamentalsDto | null {
  const instrument = getInstrumentById(instrumentId);
  return instrument === undefined
    ? null
    : parseGenerated(
        InstrumentFundamentalsSchema,
        fundamentalsFor(ctx, instrument),
        'fundamentals',
      );
}

const WATCHLIST_DEFINITIONS: readonly { id: string; name: string; symbols: readonly string[] }[] = [
  {
    id: 'wl-core-us',
    name: 'Core US',
    symbols: ['inst-us-aapl', 'inst-us-nvda', 'inst-us-tsla', 'inst-us-spy'],
  },
  {
    id: 'wl-asia-india',
    name: 'Asia and India',
    symbols: ['inst-in-reliance', 'inst-in-tatamotors', 'inst-jp-7203'],
  },
  {
    id: 'wl-macro-hedges',
    name: 'Macro hedges',
    symbols: ['inst-us-gold', 'inst-us-btc', 'inst-us-treasury'],
  },
];

export function generateWatchlists(): readonly WatchlistDto[] {
  const known = new Set(CANONICAL_INSTRUMENTS.map((instrument) => instrument.id as string));
  return parseGeneratedList(
    WatchlistSchema,
    WATCHLIST_DEFINITIONS.map((definition, index) => ({
      id: definition.id,
      name: definition.name,
      instrumentIds: definition.symbols.filter((id) => known.has(id)),
      createdAt: `2025-0${index + 1}-01T09:00:00Z`,
    })),
    'watchlists',
  );
}
