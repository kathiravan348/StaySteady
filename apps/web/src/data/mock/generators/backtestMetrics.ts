// Costs, breakdowns and validation for a backtest result (UI spec 7.10).
// Metric groups live in backtestMetricGroups.ts.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  BacktestResultDto,
  BreakdownGroupSchema,
  CostBreakdownSchema,
  ValidationSchema,
} from '../../schemas';
import type { EquityPoint } from './backtestDetail';
import { getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { currencyDecimals } from './values';

type BreakdownGroupInput = z.input<typeof BreakdownGroupSchema>;
type BreakdownRowInput = BreakdownGroupInput['rows'][number];
type CostInput = z.input<typeof CostBreakdownSchema>;
type ValidationInput = z.input<typeof ValidationSchema>;
type Currency = BacktestResultDto['initialCapital']['currency'];
type MonthlyReturn = {
  readonly year: number;
  readonly month: number;
  readonly returnPercent: number;
};

const money = (amount: Decimal, currency: Currency): { amount: string; currency: Currency } => ({
  amount: amount.toFixed(currencyDecimals(currency)),
  currency,
});

// Modelled with the assumptions the setup screen pre-fills: 2 bps commission, 3 bps slippage.
const COMMISSION_RATE = 0.0002;
const SLIPPAGE_RATE = 0.0003;
const CONVERSION_RATE = 0.00005;
const TURNOVER_PER_TRADE = 0.35;

export function buildCosts(result: BacktestResultDto): CostInput {
  const currency = result.initialCapital.currency;
  const trades = Math.max(1, result.metrics.totalTrades);
  const tradedValue = new Decimal(result.initialCapital.amount)
    .times(trades)
    .times(TURNOVER_PER_TRADE);
  const fees = tradedValue.times(COMMISSION_RATE);
  const slippage = tradedValue.times(SLIPPAGE_RATE);
  const conversion = tradedValue.times(CONVERSION_RATE);
  const total = fees.plus(slippage).plus(conversion);
  // The saved return is already net of costs, so gross is the return plus what costs took.
  const net = new Decimal(result.totalReturn.amount);
  const gross = net.plus(total);
  return {
    fees: money(fees, currency),
    slippage: money(slippage, currency),
    currencyConversion: money(conversion, currency),
    total: money(total, currency),
    grossReturn: money(gross, currency),
    netReturn: money(net, currency),
    costsAsPercentOfGross: gross.isZero()
      ? 0
      : Number(total.dividedBy(gross).times(100).toFixed(2)),
    averageCostPerTrade: money(total.dividedBy(trades), currency),
  };
}

function breakdownRow(
  key: string,
  trades: number,
  returnPercent: number,
  contribution: Decimal,
  winRate: number,
  currency: Currency,
): BreakdownRowInput {
  return {
    key,
    label: key,
    trades,
    returnPercent: Number(returnPercent.toFixed(2)),
    contribution: money(contribution, currency),
    winRatePercent: Number(winRate.toFixed(1)),
  };
}

function yearRows(
  result: BacktestResultDto,
  months: readonly MonthlyReturn[],
  stream: ReturnType<MockGeneratorContext['random']['fork']>,
): BreakdownRowInput[] {
  const currency = result.initialCapital.currency;
  const totalReturn = new Decimal(result.totalReturn.amount);
  const years = [...new Set(months.map((month) => month.year))].sort();
  const returns = years.map(
    (year) =>
      months
        .filter((month) => month.year === year)
        .reduce((factor, month) => factor * (1 + month.returnPercent / 100), 1) - 1,
  );
  // Split the total across years in proportion to each year's own return, so the contributions add
  // up to the result and a losing year shows a negative contribution.
  const returnSum = returns.reduce((sum, value) => sum + value, 0);
  return years.map((year, index) => {
    const compounded = returns[index] ?? 0;
    const share = returnSum === 0 ? 1 / Math.max(1, years.length) : compounded / returnSum;
    return breakdownRow(
      String(year),
      Math.max(1, Math.round(result.metrics.totalTrades / Math.max(1, years.length))),
      compounded * 100,
      totalReturn.times(share),
      result.metrics.winRate + stream.float(-6, 6),
      currency,
    );
  });
}

export function buildBreakdowns(
  ctx: MockGeneratorContext,
  result: BacktestResultDto,
  months: readonly MonthlyReturn[],
  instrumentIds: readonly string[],
): BreakdownGroupInput[] {
  const currency = result.initialCapital.currency;
  const totalReturn = new Decimal(result.totalReturn.amount);
  const stream = ctx.random.fork(`backtest-breakdown:${result.id}`);

  // Each traded instrument carries a seeded share of the result; groups sum those shares.
  const splits = instrumentIds.map((id) => ({ id, weight: stream.float(0.5, 1.5) }));
  const weightTotal = splits.reduce((sum, split) => sum + split.weight, 0) || 1;
  const grouped = (pick: (instrumentId: string) => string): BreakdownRowInput[] => {
    const totals = new Map<string, { weight: number; trades: number }>();
    splits.forEach((split) => {
      const key = pick(split.id);
      const current = totals.get(key) ?? { weight: 0, trades: 0 };
      totals.set(key, {
        weight: current.weight + split.weight,
        trades: current.trades + Math.round(result.metrics.totalTrades / splits.length),
      });
    });
    return [...totals.entries()].map(([key, value]) =>
      breakdownRow(
        key,
        value.trades,
        result.totalReturnPercent * (value.weight / weightTotal),
        totalReturn.times(value.weight / weightTotal),
        result.metrics.winRate + stream.float(-5, 5),
        currency,
      ),
    );
  };

  return [
    { id: 'year', title: 'By year', rows: yearRows(result, months, stream) },
    {
      id: 'market',
      title: 'By market',
      rows: grouped((id) => getInstrumentById(id)?.marketId ?? 'Unknown'),
    },
    {
      id: 'instrumentType',
      title: 'By instrument type',
      rows: grouped((id) => getInstrumentById(id)?.type.replaceAll('_', ' ') ?? 'Unknown'),
    },
    {
      id: 'currency',
      title: 'By currency',
      rows: grouped((id) => getInstrumentById(id)?.currency ?? 'Unknown'),
    },
  ];
}

export function buildValidation(
  ctx: MockGeneratorContext,
  result: BacktestResultDto,
  points: readonly EquityPoint[],
): ValidationInput {
  const stream = ctx.random.fork(`backtest-validation:${result.id}`);
  const splitIndex = Math.floor(points.length * 0.7);
  const split = points[splitIndex] ?? points[points.length - 1];
  const first = points[0];
  const last = points[points.length - 1];
  const inSampleReturn =
    first === undefined || split === undefined
      ? 0
      : ((split.equity - first.equity) / first.equity) * 100;
  const outSampleReturn =
    split === undefined || last === undefined
      ? 0
      : ((last.equity - split.equity) / split.equity) * 100;

  // An outlier-dependent run keeps most of its profit in a couple of trades.
  const topShare = result.hasOutlierDependency ? stream.float(58, 68) : stream.float(14, 26);

  return {
    inSample: {
      startDate: first?.date ?? result.startDate,
      endDate: split?.date ?? result.endDate,
      returnPercent: Number(inSampleReturn.toFixed(2)),
      sharpeRatio: Number((result.metrics.sharpeRatio * 1.1).toFixed(2)),
    },
    outOfSample: {
      startDate: split?.date ?? result.startDate,
      endDate: last?.date ?? result.endDate,
      returnPercent: Number(outSampleReturn.toFixed(2)),
      sharpeRatio: Number((result.metrics.sharpeRatio * stream.float(0.55, 0.85)).toFixed(2)),
    },
    sensitivity: [0.5, 0.75, 1, 1.25, 1.5].map((factor) => ({
      parameter: 'Main lookback period',
      value: `${Math.round(20 * factor)} bars`,
      returnPercent: Number(
        (result.totalReturnPercent * (1 - Math.abs(1 - factor) * stream.float(0.5, 1.4))).toFixed(
          2,
        ),
      ),
      isChosen: factor === 1,
    })),
    topTradeSharePercent: Number(topShare.toFixed(1)),
    topTradeCount: result.hasOutlierDependency ? 2 : 5,
    tradesNeededForHalfProfit: Math.max(
      1,
      Math.round(result.metrics.totalTrades * (result.hasOutlierDependency ? 0.01 : 0.12)),
    ),
  };
}
