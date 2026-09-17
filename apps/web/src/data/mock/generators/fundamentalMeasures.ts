// Derived measures, industry medians and warning flags for one company (R-06; decision 53).
// The arithmetic lives in shared/fundamentals; this file supplies the statements, the price and the
// peer group, and is the single place any consumer gets a ratio from.

import { Decimal } from 'decimal.js';

import { fundamentalFlags } from '../../../shared/fundamentals/flags';
import { computeMeasures } from '../../../shared/fundamentals/measures';
import type { ComputedMeasure } from '../../../shared/fundamentals/measureTypes';
import type { FinancialStatementDto, InstrumentDto, StatementBasis } from '../../schemas';
import type {
  FundamentalMeasuresDto,
  FundamentalMeasuresResponseDto,
} from '../../schemas/fundamental-measures';
import {
  FundamentalMeasuresResponseSchema,
  FundamentalMeasuresSchema,
} from '../../schemas/fundamental-measures';
import { getInstrumentById } from './canonicalInstruments';
import { industryLabelForSymbol, peerSymbolsForSymbol } from './classification';
import { INDUSTRY_BY_SYMBOL } from './classificationAssignments';
import { statementsForSymbol } from './financialStatements';
import type { MockGeneratorContext } from './mockContext';
import { ownershipForInstrument } from './ownershipPattern';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { currencyDecimals } from './values';
import { parseGenerated } from './validated';

const SOURCE = 'Derived from reported statements and the price history (mock)';

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0
      ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
      : (sorted[middle] ?? 0);
  return Number(value.toFixed(4));
}

// A price only belongs in a ratio when it is quoted in the same currency the company reports in.
function pricePerShare(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  reportingCurrency: string,
): string | null {
  if (instrument.currency !== reportingCurrency) return null;
  const bars = generatePriceHistoryForInstrument(ctx, instrument);
  return bars[bars.length - 1]?.close ?? null;
}

function onBasis(
  statements: readonly FinancialStatementDto[],
  basis: StatementBasis,
): FinancialStatementDto[] {
  return statements.filter((statement) => statement.basis === basis);
}

// The same measures over the statements as they stood in each earlier year. Price is left out, so a
// valuation measure has no history rather than a misleading one computed at today's price.
function historyFor(annual: readonly FinancialStatementDto[], depth: number): ComputedMeasure[][] {
  return Array.from({ length: depth }, (_unused, index) =>
    computeMeasures({ annual: annual.slice(index + 1), quarterly: [], pricePerShare: null }),
  );
}

function peerMeasures(
  ctx: MockGeneratorContext,
  symbol: string,
  basis: StatementBasis,
): { symbols: string[]; measures: ComputedMeasure[][] } {
  const symbols: string[] = [];
  const measures: ComputedMeasure[][] = [];
  for (const peer of peerSymbolsForSymbol(symbol)) {
    const peerStatements = statementsForSymbol(ctx, peer);
    if (peerStatements === null) continue;
    const peerInstrument = peerStatements.instrument;
    const annual = onBasis(peerStatements.statements.annual, basis);
    if (annual.length === 0) continue;
    symbols.push(peer);
    measures.push(
      computeMeasures({
        annual,
        quarterly: onBasis(peerStatements.statements.quarterly, basis),
        pricePerShare: pricePerShare(
          ctx,
          peerInstrument,
          peerStatements.statements.reportingCurrency,
        ),
      }),
    );
  }
  return { symbols, measures };
}

export function measuresFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
  basis: StatementBasis = 'consolidated',
): FundamentalMeasuresDto | null {
  const own = statementsForSymbol(ctx, instrument.symbol);
  if (own === null) return null;
  const annual = onBasis(own.statements.annual, basis);
  const latest = annual[0];
  if (latest === undefined) return null;

  const price = pricePerShare(ctx, instrument, own.statements.reportingCurrency);
  const measures = computeMeasures({
    annual,
    quarterly: onBasis(own.statements.quarterly, basis),
    pricePerShare: price,
  });
  const history = historyFor(annual, Math.min(3, Math.max(0, annual.length - 1)));
  const peers = peerMeasures(ctx, instrument.symbol, basis);
  const ownership = ownershipForInstrument(ctx, instrument);

  const shares = latest.balanceSheet.sharesOutstanding;
  const currency = own.statements.reportingCurrency;
  const marketCap =
    price === null
      ? null
      : {
          amount: new Decimal(price).times(shares).toFixed(currencyDecimals(currency)),
          currency,
        };

  return parseGenerated(
    FundamentalMeasuresSchema,
    {
      instrumentId: String(instrument.id),
      symbol: instrument.symbol,
      basis,
      latestPeriod: latest.fiscalPeriod,
      marketCap,
      sharesOutstanding: shares,
      industryName: industryLabelForSymbol(instrument.symbol),
      peerSymbols: peers.symbols,
      measures: measures.map((measure) => ({
        id: measure.id,
        label: measure.label,
        group: measure.group,
        unit: measure.unit,
        value: measure.value,
        inputs: measure.inputs,
        periods: [...measure.periods],
        note: measure.note,
        industryMedian: median(
          peers.measures.flatMap((peer) => {
            const match = peer.find((item) => item.id === measure.id);
            return match?.value === null || match?.value === undefined ? [] : [match.value];
          }),
        ),
        peerCount: peers.symbols.length,
        history: history.map((year) => year.find((item) => item.id === measure.id)?.value ?? null),
      })),
      flags: fundamentalFlags({
        annual,
        pledgeTrend: (ownership?.points ?? []).flatMap((point) =>
          point.promoterPledgePercent === null ? [] : [point.promoterPledgePercent],
        ),
      }),
      asOf: String(ctx.referenceTime).slice(0, 10),
      source: SOURCE,
      note:
        price === null
          ? 'The price is quoted in a different currency from the reported statements, so valuation measures are left out rather than converted at a rate the company never used.'
          : `Valuation measures use the latest close of ${price} ${currency} against ${basis} statements to ${latest.fiscalPeriod}.`,
    },
    'fundamental measures',
  );
}

export function generateFundamentalMeasures(
  ctx: MockGeneratorContext,
  instrumentId: string,
  basis: StatementBasis = 'consolidated',
): FundamentalMeasuresResponseDto | null {
  const instrument = getInstrumentById(instrumentId);
  if (instrument === undefined) return null;
  const measures = measuresFor(ctx, instrument, basis);
  return parseGenerated(
    FundamentalMeasuresResponseSchema,
    {
      instrumentId: String(instrument.id),
      measures,
      unavailableReason:
        measures !== null
          ? null
          : INDUSTRY_BY_SYMBOL[instrument.symbol] === undefined
            ? 'No company sits behind this instrument, so there are no ratios to derive.'
            : 'No statements have been collected for this company, so nothing can be derived yet.',
    },
    'fundamental measures response',
  );
}
