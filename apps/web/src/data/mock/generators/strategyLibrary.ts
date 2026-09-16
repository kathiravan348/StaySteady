// Strategy Library entries (UI spec 7.7). Each strategy is joined to the holdings it opened and to
// the backtest it was proven with, so allocation, live result and divergence are derived from data
// the rest of the app already shows rather than invented here.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  BacktestResultDto,
  HoldingDto,
  PortfolioSummaryDto,
  StrategyDto,
  StrategyLibraryEntryDto,
  StrategyStageDto,
} from '../../schemas';
import { StrategyLibraryEntrySchema } from '../../schemas';
import { generateBacktestResults } from './backtests';
import { getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { generatePortfolioData } from './portfolio';
import { generateStrategies } from './trading';
import { parseGeneratedList } from './validated';

type EntryInput = z.input<typeof StrategyLibraryEntrySchema>;
type BaseMoney = { amount: string; currency: PortfolioSummaryDto['totalValue']['currency'] };

// How far live return may drift from the backtest's annual expectation before it is worth saying so.
const ALIGNED_POINTS = 5;
const WATCH_POINTS = 15;
const HOUR_MS = 3_600_000;

interface LivePosition {
  readonly allocationPercent: number;
  readonly returnPercent: number;
  readonly openPositions: number;
}

// Allocation shares are already portfolio-relative in the base currency, so they add up across
// markets without a second FX conversion here.
function summarisePositions(holdings: readonly HoldingDto[]): LivePosition | null {
  if (holdings.length === 0) return null;
  const allocation = holdings.reduce((sum, holding) => sum + Number(holding.allocationPercent), 0);
  const weighted = holdings.reduce(
    (sum, holding) =>
      sum + Number(holding.allocationPercent) * Number(holding.unrealisedGainLossPercent),
    0,
  );
  return {
    allocationPercent: Number(allocation.toFixed(2)),
    returnPercent: allocation === 0 ? 0 : Number((weighted / allocation).toFixed(2)),
    openPositions: holdings.length,
  };
}

function shareOfPortfolio(summary: PortfolioSummaryDto, allocationPercent: number): BaseMoney {
  const amount = new Decimal(summary.totalValue.amount).times(allocationPercent).dividedBy(100);
  return { amount: amount.toFixed(2), currency: summary.totalValue.currency };
}

// Current value already includes the gain, so the cost is backed out of the return rather than
// re-converted from each holding's own currency.
function gainFromReturn(value: BaseMoney, returnPercent: number): BaseMoney {
  const current = new Decimal(value.amount);
  const cost = current.dividedBy(new Decimal(1).plus(new Decimal(returnPercent).dividedBy(100)));
  return { amount: current.minus(cost).toFixed(2), currency: value.currency };
}

function describeDivergence(
  live: LivePosition | null,
  backtest: BacktestResultDto | undefined,
): EntryInput['divergence'] {
  if (backtest === undefined) return null;
  const expected = backtest.metrics.cagr.toFixed(2);
  if (live === null) {
    return {
      deltaPercentagePoints: 0,
      severity: 'unproven',
      explanation: 'No live positions yet, so the backtest has not been tested against reality.',
    };
  }
  const delta = Number((live.returnPercent - backtest.metrics.cagr).toFixed(2));
  const size = Math.abs(delta);
  const severity = size <= ALIGNED_POINTS ? 'aligned' : size <= WATCH_POINTS ? 'watch' : 'diverged';
  const direction = delta < 0 ? 'behind' : 'ahead of';
  return {
    deltaPercentagePoints: delta,
    severity,
    explanation:
      severity === 'aligned'
        ? `Live return is within ${String(ALIGNED_POINTS)} points of the backtested ${expected}% a year.`
        : `Live return is ${size.toFixed(2)} points ${direction} the backtested ${expected}% a year.`,
  };
}

const RUN_MESSAGE_BY_STAGE: Readonly<Record<StrategyStageDto, string>> = {
  draft: 'Never run.',
  backtested: 'Backtest completed. Not yet generating live signals.',
  observation: 'Ran in observation only, recording signals without placing orders.',
  semi_automatic: 'Ran and generated signals for approval.',
  fully_automatic: 'Ran, generated signals and placed orders automatically.',
};

// A strategy still in draft has never run; one strategy is given a failed run so the failure state
// appears somewhere in the mock data.
function describeLastRun(
  strategy: StrategyDto,
  referenceTime: string,
  hoursAgo: number,
): EntryInput['lastRun'] {
  const at = new Date(new Date(referenceTime).getTime() - hoursAgo * HOUR_MS).toISOString();
  if (strategy.stage === 'draft') {
    return {
      at,
      status: 'never_run',
      message: 'Never run. Still a draft, so it generates nothing.',
    };
  }
  if (String(strategy.id) === 'strat-breakout-vol') {
    return {
      at,
      status: 'failed',
      message: 'Last run failed: gold price history had a gap the strategy could not span.',
    };
  }
  return { at, status: 'succeeded', message: RUN_MESSAGE_BY_STAGE[strategy.stage] };
}

function buildEntry(
  strategy: StrategyDto,
  holdings: readonly HoldingDto[],
  summary: PortfolioSummaryDto,
  backtests: readonly BacktestResultDto[],
  referenceTime: string,
  hoursAgo: number,
): EntryInput {
  const instruments = strategy.universe.map((id) => getInstrumentById(String(id)));
  const owned = holdings.filter(
    (holding) => String(holding.openedByStrategyId ?? '') === String(strategy.id),
  );
  const live = summarisePositions(owned);
  const backtest = backtests.find((result) => String(result.strategyId) === String(strategy.id));
  const allocationPercent = live?.allocationPercent ?? 0;
  const allocatedCapital = shareOfPortfolio(summary, allocationPercent);

  return {
    strategyId: strategy.id,
    name: strategy.name,
    description: strategy.description,
    version: strategy.version,
    stage: strategy.stage,
    timeframe: strategy.timeframe,
    universe: [...strategy.universe],
    instrumentSymbols: instruments.map((instrument, index) =>
      instrument === undefined ? String(strategy.universe[index]) : instrument.symbol,
    ),
    marketIds: [
      ...new Set(
        instruments.flatMap((instrument) =>
          instrument === undefined ? [] : [String(instrument.marketId)],
        ),
      ),
    ],
    instrumentTypes: [
      ...new Set(
        instruments.flatMap((instrument) => (instrument === undefined ? [] : [instrument.type])),
      ),
    ],
    allocatedCapital,
    allocationPercent,
    backtest:
      backtest === undefined
        ? null
        : {
            backtestId: backtest.id,
            totalReturnPercent: backtest.totalReturnPercent,
            cagr: backtest.metrics.cagr,
            sharpeRatio: backtest.metrics.sharpeRatio,
            maxDrawdown: backtest.metrics.maxDrawdown,
            periodLabel: `${backtest.startDate} to ${backtest.endDate}`,
          },
    live:
      live === null
        ? null
        : {
            returnPercent: live.returnPercent,
            gainLoss: gainFromReturn(allocatedCapital, live.returnPercent),
            openPositions: live.openPositions,
          },
    divergence: describeDivergence(live, backtest),
    lastRun: describeLastRun(strategy, referenceTime, hoursAgo),
  };
}

export function generateStrategyLibrary(
  ctx: MockGeneratorContext,
  isEmptyScenario = false,
): readonly StrategyLibraryEntryDto[] {
  const strategies = generateStrategies(ctx);
  const backtests = generateBacktestResults(ctx);
  const portfolio = generatePortfolioData(ctx, isEmptyScenario);
  const stream = ctx.random.fork('strategy-library');

  const entries = strategies.map((strategy, index) =>
    buildEntry(
      strategy,
      portfolio.holdings,
      portfolio.summary,
      backtests,
      String(ctx.referenceTime),
      Math.round(stream.float(1, 40)) + index,
    ),
  );
  return parseGeneratedList(StrategyLibraryEntrySchema, entries, 'StrategyLibraryEntry');
}
