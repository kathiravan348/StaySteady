// Assembles a company's reported periods (R-05; requirements 37; decision 50): five years annual
// and eight quarters interim, on every basis the company publishes, each with the date it was
// published so a backtest can only use what had been reported at the time.

import type { InstrumentDto } from '../../schemas';
import type {
  FinancialStatementsDto,
  FinancialStatementsResponseDto,
  StatementBasis,
} from '../../schemas';
import { FinancialStatementsResponseSchema, FinancialStatementsSchema } from '../../schemas';
import { getInstrumentById } from './canonicalInstruments';
import { INDUSTRY_BY_SYMBOL } from './classificationAssignments';
import { buildStatement } from './financialStatementBuild';
import type { StatementSeed } from './financialStatementSeeds';
import { STATEMENT_SEEDS } from './financialStatementSeeds';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated } from './validated';

const ANNUAL_PERIODS = 5;
const QUARTER_PERIODS = 8;
const ANNUAL_PUBLICATION_LAG_DAYS = 75;
const QUARTER_PUBLICATION_LAG_DAYS = 45;
const SOURCE = 'Company reported statements (mock)';

const iso = (date: Date): string => date.toISOString().slice(0, 10);

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

// Last day of the month `months` before `from`, keeping the fiscal day of month.
function shiftMonths(date: Date, months: number): Date {
  const shifted = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months + 1, 0, 0, 0, 0),
  );
  return shifted;
}

// The most recent fiscal year end that has already happened.
function latestFiscalYearEnd(fiscalYearEnd: string, reference: string): Date {
  const [month, day] = fiscalYearEnd.split('-').map((part) => Number(part));
  const referenceDate = new Date(`${reference}T00:00:00Z`);
  const year = referenceDate.getUTCFullYear();
  const candidate = new Date(Date.UTC(year, (month ?? 12) - 1, day ?? 31));
  return candidate <= referenceDate
    ? candidate
    : new Date(Date.UTC(year - 1, (month ?? 12) - 1, day ?? 31));
}

function revenueForYearsAgo(seed: StatementSeed, yearsAgo: number): number {
  return seed.revenueMillions / Math.pow(1 + seed.revenueGrowth, yearsAgo);
}

const monthIndex = (date: Date): number => date.getUTCFullYear() * 12 + date.getUTCMonth();

// The fiscal year a quarter belongs to is the first year end on or after the quarter end.
function fiscalYearEndFor(periodEnd: Date, latestFiscalEnd: Date): Date {
  let candidate = latestFiscalEnd;
  while (monthIndex(candidate) < monthIndex(periodEnd)) candidate = shiftMonths(candidate, 12);
  while (monthIndex(shiftMonths(candidate, -12)) >= monthIndex(periodEnd)) {
    candidate = shiftMonths(candidate, -12);
  }
  return candidate;
}

// Months back from the year end: 0 is the fourth quarter, 9 is the first.
function quarterOfFiscalYear(periodEnd: Date, fiscalYearEnd: Date): number {
  const months = monthIndex(fiscalYearEnd) - monthIndex(periodEnd);
  return Math.min(4, Math.max(1, 4 - Math.round(months / 3)));
}

function seasonalityFor(seed: StatementSeed, quarter: number): number {
  const weights = seed.quarterSeasonality ?? [1, 1, 1, 1];
  return weights[quarter - 1] ?? 1;
}

function annualStatements(
  instrument: InstrumentDto,
  seed: StatementSeed,
  basis: StatementBasis,
  fiscalEnd: Date,
): ReturnType<typeof buildStatement>[] {
  return Array.from({ length: ANNUAL_PERIODS }, (_unused, index) => {
    const periodEnd = shiftMonths(fiscalEnd, -12 * index);
    const revenue = revenueForYearsAgo(seed, index);
    const isRestated = seed.restatedYearIndex === index;
    return buildStatement({
      instrumentId: String(instrument.id),
      seed,
      basis,
      periodType: 'annual',
      fiscalPeriod: `FY${String(periodEnd.getUTCFullYear())}`,
      periodEnd: iso(periodEnd),
      publishedOn: iso(addDays(periodEnd, ANNUAL_PUBLICATION_LAG_DAYS)),
      revenueMillions: revenue,
      annualRevenueMillions: revenue,
      isAudited: true,
      isRestated,
      restatementNote: isRestated
        ? 'Reissued after publication: subsidiary results were reclassified between segments, changing reported revenue and profit for this year.'
        : null,
      forceNegativeFreeCashFlow: index < (seed.negativeFreeCashFlowYears ?? 0),
    });
  });
}

function quarterlyStatements(
  instrument: InstrumentDto,
  seed: StatementSeed,
  basis: StatementBasis,
  fiscalEnd: Date,
  reference: string,
): ReturnType<typeof buildStatement>[] {
  // Interim reporting runs past the last audited year end; walk forward to the latest quarter that
  // has both ended and had time to be published.
  let latestQuarterEnd = fiscalEnd;
  for (;;) {
    const next = shiftMonths(latestQuarterEnd, 3);
    if (iso(addDays(next, QUARTER_PUBLICATION_LAG_DAYS)) > reference) break;
    latestQuarterEnd = next;
  }

  return Array.from({ length: QUARTER_PERIODS }, (_unused, index) => {
    const periodEnd = shiftMonths(latestQuarterEnd, -3 * index);
    const fiscalYearOfQuarter = fiscalYearEndFor(periodEnd, fiscalEnd);
    // A quarter inside the year now in progress is scaled on the latest reported year.
    const yearsAgo = Math.max(0, (monthIndex(fiscalEnd) - monthIndex(fiscalYearOfQuarter)) / 12);
    const annualRevenue = revenueForYearsAgo(seed, yearsAgo);
    const quarter = quarterOfFiscalYear(periodEnd, fiscalYearOfQuarter);
    return buildStatement({
      instrumentId: String(instrument.id),
      seed,
      basis,
      periodType: 'quarter',
      fiscalPeriod: `Q${String(quarter)} FY${String(fiscalYearOfQuarter.getUTCFullYear())}`,
      periodEnd: iso(periodEnd),
      publishedOn: iso(addDays(periodEnd, QUARTER_PUBLICATION_LAG_DAYS)),
      revenueMillions: (annualRevenue / 4) * seasonalityFor(seed, quarter),
      annualRevenueMillions: annualRevenue,
      isAudited: false,
      isRestated: false,
      restatementNote: null,
      forceNegativeFreeCashFlow: (seed.negativeFreeCashFlowYears ?? 0) > 0,
    });
  });
}

export function statementsFor(
  ctx: MockGeneratorContext,
  instrument: InstrumentDto,
): FinancialStatementsDto | null {
  const seed = STATEMENT_SEEDS[instrument.symbol];
  if (seed === undefined) return null;
  const reference = String(ctx.referenceTime).slice(0, 10);
  const fiscalEnd = latestFiscalYearEnd(seed.fiscalYearEnd, reference);
  const bases: StatementBasis[] =
    seed.standaloneShareOfRevenue === undefined ? ['consolidated'] : ['consolidated', 'standalone'];

  return parseGenerated(
    FinancialStatementsSchema,
    {
      instrumentId: String(instrument.id),
      reportingCurrency: seed.currency,
      fiscalYearEnd: seed.fiscalYearEnd,
      basesAvailable: bases,
      annual: bases.flatMap((basis) => annualStatements(instrument, seed, basis, fiscalEnd)),
      quarterly: bases.flatMap((basis) =>
        quarterlyStatements(instrument, seed, basis, fiscalEnd, reference),
      ),
      asOf: reference,
      source: SOURCE,
      note:
        bases.length > 1
          ? 'Consolidated and standalone are both published. Standalone excludes subsidiaries, so the two are not interchangeable.'
          : 'Only consolidated statements are published for this company.',
    },
    'financial statements',
  );
}

export function generateFinancialStatements(
  ctx: MockGeneratorContext,
  instrumentId: string,
): FinancialStatementsResponseDto | null {
  const instrument = getInstrumentById(instrumentId);
  if (instrument === undefined) return null;
  const statements = statementsFor(ctx, instrument);
  return parseGenerated(
    FinancialStatementsResponseSchema,
    {
      instrumentId: String(instrument.id),
      statements,
      unavailableReason:
        statements !== null
          ? null
          : INDUSTRY_BY_SYMBOL[instrument.symbol] === undefined
            ? 'No company sits behind this instrument, so it publishes no financial statements.'
            : 'No statements have been collected for this company yet.',
    },
    'financial statements response',
  );
}
