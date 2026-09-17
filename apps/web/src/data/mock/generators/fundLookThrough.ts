// Fund look-through: the sector weights and largest holdings behind each fund (R-03;
// requirements 36). Weights are seeded per fund rather than derived, because a real provider
// supplies them; what matters here is that exposure through a fund is measurable at all.

import type { InstrumentDto } from '../../schemas';
import type {
  FundLookThroughDto,
  FundLookThroughResponseDto,
} from '../../schemas/fund-lookthrough';
import {
  FundLookThroughResponseSchema,
  FundLookThroughSchema,
} from '../../schemas/fund-lookthrough';
import { CANONICAL_INSTRUMENTS, getInstrumentById } from './canonicalInstruments';
import { GROUP_ID_BY_SYMBOL, GROUPS } from './classificationAssignments';
import { sectorNameForSymbol } from './classification';
import { TAXONOMY_SECTORS } from './classificationTaxonomy';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

const SOURCE = 'Fund factsheet holdings disclosure (mock)';

interface FundDefinition {
  readonly indexTracked: string | null;
  readonly aum: readonly [string, 'USD' | 'INR'] | null;
  readonly holdingCount: number;
  readonly holdings: readonly (readonly [string, string, number])[];
  readonly sectors: readonly (readonly [string, number])[];
}

const FUNDS: Readonly<Record<string, FundDefinition>> = {
  SPY: {
    indexTracked: 'S&P 500',
    aum: ['624000000000', 'USD'],
    holdingCount: 503,
    holdings: [
      ['AAPL', 'Apple Inc.', 7.1],
      ['NVDA', 'NVIDIA Corporation', 6.8],
      ['MSFT', 'Microsoft Corporation', 6.2],
      ['GOOGL', 'Alphabet Inc.', 4.1],
      ['TSLA', 'Tesla Inc.', 2.2],
      ['BRK.B', 'Berkshire Hathaway Inc.', 1.7],
      ['JPM', 'JPMorgan Chase & Co.', 1.5],
      ['V', 'Visa Inc.', 1.1],
      ['JNJ', 'Johnson & Johnson', 0.8],
    ],
    sectors: [
      ['Information technology', 33.4],
      ['Financials', 13.6],
      ['Health care', 10.1],
      ['Consumer discretionary', 10.0],
      ['Communication services', 9.6],
      ['Industrials', 8.2],
      ['Consumer staples', 5.6],
      ['Energy', 3.3],
      ['Utilities', 2.4],
      ['Real estate', 2.1],
      ['Materials', 1.7],
    ],
  },
  VTSAX: {
    indexTracked: 'CRSP US Total Market',
    aum: ['1480000000000', 'USD'],
    holdingCount: 3612,
    holdings: [
      ['AAPL', 'Apple Inc.', 6.0],
      ['NVDA', 'NVIDIA Corporation', 5.7],
      ['MSFT', 'Microsoft Corporation', 5.3],
      ['GOOGL', 'Alphabet Inc.', 3.5],
      ['TSLA', 'Tesla Inc.', 1.9],
    ],
    sectors: [
      ['Information technology', 31.2],
      ['Financials', 14.1],
      ['Consumer discretionary', 10.4],
      ['Health care', 10.2],
      ['Industrials', 9.4],
      ['Communication services', 8.7],
      ['Consumer staples', 5.1],
      ['Energy', 3.6],
      ['Real estate', 2.8],
      ['Utilities', 2.5],
      ['Materials', 1.8],
    ],
  },
  QQQ: {
    indexTracked: 'Nasdaq-100',
    aum: ['352000000000', 'USD'],
    holdingCount: 101,
    holdings: [
      ['NVDA', 'NVIDIA Corporation', 9.4],
      ['AAPL', 'Apple Inc.', 8.8],
      ['MSFT', 'Microsoft Corporation', 8.1],
      ['GOOGL', 'Alphabet Inc.', 5.2],
      ['TSLA', 'Tesla Inc.', 3.1],
    ],
    sectors: [
      ['Information technology', 57.3],
      ['Communication services', 15.8],
      ['Consumer discretionary', 13.1],
      ['Health care', 5.4],
      ['Industrials', 4.2],
      ['Consumer staples', 3.1],
    ],
  },
  NIFTYBEES: {
    indexTracked: 'Nifty 50',
    aum: ['320000000000', 'INR'],
    holdingCount: 50,
    holdings: [
      ['HDFCBANK', 'HDFC Bank Limited', 11.9],
      ['RELIANCE', 'Reliance Industries Limited', 8.4],
      ['TCS', 'Tata Consultancy Services Limited', 4.1],
      ['INFY', 'Infosys Limited', 3.8],
      ['TATAMOTORS', 'Tata Motors Limited', 2.2],
    ],
    sectors: [
      ['Financials', 36.2],
      ['Information technology', 13.4],
      ['Energy', 11.8],
      ['Consumer discretionary', 10.6],
      ['Consumer staples', 8.1],
      ['Materials', 6.4],
      ['Health care', 5.2],
      ['Industrials', 4.3],
      ['Utilities', 2.1],
    ],
  },
};

export function isLookThroughFund(symbol: string): boolean {
  return Object.hasOwn(FUNDS, symbol);
}

function lookThroughFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  definition: FundDefinition,
): FundLookThroughDto {
  const covered = definition.holdings.reduce((total, [, , weight]) => total + weight, 0);
  return parseGenerated(
    FundLookThroughSchema,
    {
      instrumentId: String(instrument.id),
      fundName: instrument.name,
      indexTracked: definition.indexTracked,
      assetsUnderManagement:
        definition.aum === null ? null : { amount: definition.aum[0], currency: definition.aum[1] },
      holdingCount: definition.holdingCount,
      topHoldings: definition.holdings.map(([symbol, name, weightPercent]) => {
        const canonical = CANONICAL_INSTRUMENTS.find((item) => item.symbol === symbol);
        const groupId = GROUP_ID_BY_SYMBOL[symbol];
        return {
          symbol,
          name,
          instrumentId: canonical === undefined ? null : String(canonical.id),
          weightPercent,
          sectorName: sectorNameForSymbol(symbol),
          groupName: groupId === undefined ? null : (GROUPS[groupId] ?? null),
        };
      }),
      sectorWeights: definition.sectors.map(([sectorName, weightPercent]) => ({
        sectorId: sectorIdFor(sectorName),
        sectorName,
        weightPercent,
      })),
      asOf: String(ctx.referenceTime).slice(0, 10),
      source: SOURCE,
      note: `${String(definition.holdingCount)} holdings; the ${String(definition.holdings.length)} largest shown here are ${covered.toFixed(1)}% of the fund. Sector weights cover the whole fund.`,
    },
    'fund look-through',
  );
}

// Sector ids come from the taxonomy, so a fund's weights group with a company's sector.
function sectorIdFor(sectorName: string): string | null {
  return TAXONOMY_SECTORS.find((sector) => sector.name === sectorName)?.id ?? null;
}

export function fundLookThroughFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): FundLookThroughDto | null {
  const definition = FUNDS[instrument.symbol];
  return definition === undefined ? null : lookThroughFor(ctx, instrument, definition);
}

export function generateFundLookThrough(
  ctx: MockGeneratorContext,
  instrumentId: string,
): FundLookThroughResponseDto | null {
  const instrument = getInstrumentById(instrumentId);
  if (instrument === undefined) return null;
  const lookThrough = fundLookThroughFor(ctx, instrument);
  return parseGenerated(
    FundLookThroughResponseSchema,
    {
      instrumentId: String(instrument.id),
      lookThrough,
      unavailableReason:
        lookThrough !== null
          ? null
          : instrument.type === 'etf' || instrument.type === 'mutual_fund'
            ? 'No holdings disclosure has been collected for this fund yet.'
            : 'This instrument is not a fund, so there is nothing to look through to.',
    },
    'fund look-through response',
  );
}
