// Backtest setup data (UI spec 7.9): cost assumptions per market as live configuration has them,
// data coverage taken from the real generated price history, and backtest runs that make progress.

import { Decimal } from 'decimal.js';

import type {
  BacktestConfigDto,
  DataCoverageDto,
  MarketCostDefaultsDto,
  BacktestRunDto,
} from '../../schemas';
import { BacktestRunSchema, DataCoverageSchema, MarketCostDefaultsSchema } from '../../schemas';
import { getInstrumentById } from './instruments';
import { getCanonicalMarkets, getMarketById } from './markets';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { parseGenerated, parseGeneratedList } from './validated';
import { currencyDecimals } from './values';

interface CostSeed {
  readonly commissionBps: number;
  readonly minimumCommission: string;
  readonly slippageBps: number;
  readonly fxConversionBps: number;
}

// What the live configuration uses today; the setup screen pre-fills these and warns on changes.
const MARKET_COSTS: Readonly<Record<string, CostSeed>> = {
  US: { commissionBps: 2, minimumCommission: '1.00', slippageBps: 3, fxConversionBps: 25 },
  IN: { commissionBps: 3, minimumCommission: '20.00', slippageBps: 6, fxConversionBps: 30 },
  UK: { commissionBps: 5, minimumCommission: '6.00', slippageBps: 4, fxConversionBps: 25 },
  JP: { commissionBps: 4, minimumCommission: '500', slippageBps: 5, fxConversionBps: 30 },
  SG: { commissionBps: 4, minimumCommission: '5.00', slippageBps: 5, fxConversionBps: 30 },
};

const FALLBACK_COSTS: CostSeed = {
  commissionBps: 5,
  minimumCommission: '5.00',
  slippageBps: 5,
  fxConversionBps: 30,
};

// Only the US market has an index-tracking instrument in the mock universe.
const BENCHMARKS: Readonly<Record<string, { readonly id: string; readonly label: string }>> = {
  US: { id: 'inst-us-spy', label: 'SPY · SPDR S&P 500 ETF Trust' },
};

export function generateMarketCostDefaults(): readonly MarketCostDefaultsDto[] {
  return parseGeneratedList(
    MarketCostDefaultsSchema,
    getCanonicalMarkets().map((market) => {
      const seed = MARKET_COSTS[market.marketId] ?? FALLBACK_COSTS;
      const benchmark = BENCHMARKS[market.marketId];
      return {
        marketId: market.marketId,
        marketName: market.name,
        costs: {
          commissionBps: seed.commissionBps,
          minimumCommission: {
            amount: new Decimal(seed.minimumCommission).toFixed(currencyDecimals(market.currency)),
            currency: market.currency,
          },
          slippageBps: seed.slippageBps,
          fxConversionBps: seed.fxConversionBps,
        },
        benchmarkInstrumentId: benchmark?.id ?? null,
        benchmarkLabel: benchmark?.label ?? null,
      };
    }),
    'marketCostDefaults',
  );
}

const isWeekday = (date: string): boolean => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
};

// Coverage comes from the same history the charts and backtests use, so warnings match reality.
export function generateDataCoverage(
  ctx: MockGeneratorContext,
  instrumentIds: readonly string[],
): readonly DataCoverageDto[] {
  return parseGeneratedList(
    DataCoverageSchema,
    instrumentIds.flatMap((instrumentId) => {
      const instrument = getInstrumentById(instrumentId);
      if (instrument === undefined) return [];
      const bars = generatePriceHistoryForInstrument(ctx, instrument);
      const first = bars[0];
      const last = bars[bars.length - 1];
      if (first === undefined || last === undefined) return [];
      const firstDate = first.timestamp.slice(0, 10);
      const lastDate = last.timestamp.slice(0, 10);
      const holidays = getMarketById(instrument.marketId)?.holidays ?? [];
      return [
        {
          instrumentId: instrument.id,
          symbol: instrument.symbol,
          marketId: instrument.marketId,
          firstDate,
          lastDate,
          barCount: bars.length,
          estimatedBars: bars.filter((bar) => bar.isEstimated).length,
          missingTradingDays: holidays.filter(
            (holiday) =>
              holiday.date >= firstDate && holiday.date <= lastDate && isWeekday(holiday.date),
          ).length,
        },
      ];
    }),
    'dataCoverage',
  );
}

export interface BacktestRunState {
  readonly id: string;
  readonly config: BacktestConfigDto;
  readonly startedAtMs: number;
  readonly cancelledAtMs: number | null;
}

// A mock run takes a few seconds so progress and cancellation are visible.
const RUN_DURATION_MS = 6_000;

const STAGES: readonly { readonly upTo: number; readonly stage: string }[] = [
  { upTo: 8, stage: 'Queued' },
  { upTo: 35, stage: 'Loading price history' },
  { upTo: 65, stage: 'Simulating trades' },
  { upTo: 88, stage: 'Applying costs and slippage' },
  { upTo: 100, stage: 'Computing metrics' },
];

const RESULT_BY_STRATEGY: Readonly<Record<string, string>> = {
  'strat-trend-momentum': 'bt-01-trend-follow',
  'strat-rsi-reversion': 'bt-02-mean-revert',
  'strat-earnings-breakout': 'bt-03-outlier-dependent',
};

function stageFor(progress: number): string {
  return STAGES.find((entry) => progress <= entry.upTo)?.stage ?? 'Computing metrics';
}

export function describeRun(state: BacktestRunState, now: Date): BacktestRunDto {
  const elapsed = Math.max(0, (state.cancelledAtMs ?? now.getTime()) - state.startedAtMs);
  const progress = Math.min(100, Math.round((elapsed / RUN_DURATION_MS) * 100));
  const cancelled = state.cancelledAtMs !== null;
  const completed = !cancelled && progress >= 100;
  const resultId = RESULT_BY_STRATEGY[state.config.strategyId] ?? 'bt-01-trend-follow';
  return parseGenerated(
    BacktestRunSchema,
    {
      id: state.id,
      status: cancelled
        ? 'cancelled'
        : completed
          ? 'completed'
          : progress < 8
            ? 'queued'
            : 'running',
      progressPercent: progress,
      stage: cancelled ? 'Cancelled' : completed ? 'Finished' : stageFor(progress),
      startedAt: new Date(state.startedAtMs).toISOString(),
      completedAt:
        cancelled || completed
          ? new Date(state.cancelledAtMs ?? state.startedAtMs + RUN_DURATION_MS).toISOString()
          : null,
      resultId: completed ? resultId : null,
      message: cancelled
        ? 'Run cancelled before it finished; no result was saved.'
        : completed
          ? 'Run finished. Open the results to review metrics, trades and costs.'
          : null,
      config: state.config,
    },
    'backtestRun',
  );
}
