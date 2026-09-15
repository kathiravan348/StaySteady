// Backtest result generator with outlier-dependent and robust strategies (M-10).
// Fulfills UI Spec 15 requirement for good, mediocre, and outlier-dependent test results.

import type { z } from 'zod';
import type { BacktestResultDto } from '../../schemas';
import { BacktestResultSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { toBacktestId, toStrategyId } from '../../../shared/types/identifiers';

export interface BacktestTradeItem {
  readonly id: string;
  readonly backtestId: string;
  readonly instrumentSymbol: string;
  readonly side: 'buy' | 'sell';
  readonly entryDate: string;
  readonly exitDate: string;
  readonly returnPercent: number;
  readonly pnlAmount: string;
  readonly isOutlier: boolean;
}

export function generateBacktestResults(ctx: MockGeneratorContext): readonly BacktestResultDto[] {
  const results: z.input<typeof BacktestResultSchema>[] = [
    {
      id: toBacktestId('bt-01-trend-follow'),
      strategyId: toStrategyId('strat-trend-momentum'),
      startDate: '2022-01-03',
      endDate: '2025-12-31',
      initialCapital: { amount: '100000.00', currency: 'USD' },
      finalCapital: { amount: '184250.00', currency: 'USD' },
      totalReturn: { amount: '84250.00', currency: 'USD' },
      totalReturnPercent: 84.25,
      metrics: {
        cagr: 22.58,
        sharpeRatio: 1.84,
        sortinoRatio: 2.62,
        maxDrawdown: 11.45,
        winRate: 58.4,
        profitFactor: 2.15,
        totalTrades: 320,
        calmarRatio: 1.97,
      },
      hasOutlierDependency: false,
      createdAt: ctx.referenceTime,
    },
    {
      id: toBacktestId('bt-02-mean-revert'),
      strategyId: toStrategyId('strat-rsi-reversion'),
      startDate: '2022-01-03',
      endDate: '2025-12-31',
      initialCapital: { amount: '100000.00', currency: 'USD' },
      finalCapital: { amount: '112400.00', currency: 'USD' },
      totalReturn: { amount: '12400.00', currency: 'USD' },
      totalReturnPercent: 12.4,
      metrics: {
        cagr: 3.96,
        sharpeRatio: 0.62,
        sortinoRatio: 0.78,
        maxDrawdown: 24.8,
        winRate: 46.2,
        profitFactor: 1.08,
        totalTrades: 215,
        calmarRatio: 0.16,
      },
      hasOutlierDependency: false,
      createdAt: ctx.referenceTime,
    },
    {
      id: toBacktestId('bt-03-outlier-dependent'),
      strategyId: toStrategyId('strat-earnings-breakout'),
      startDate: '2022-01-03',
      endDate: '2025-12-31',
      initialCapital: { amount: '100000.00', currency: 'USD' },
      finalCapital: { amount: '215000.00', currency: 'USD' },
      totalReturn: { amount: '115000.00', currency: 'USD' },
      totalReturnPercent: 115.0,
      metrics: {
        cagr: 29.07,
        sharpeRatio: 2.12,
        sortinoRatio: 3.05,
        maxDrawdown: 18.2,
        winRate: 38.5,
        profitFactor: 2.45,
        totalTrades: 185,
        calmarRatio: 1.6,
      },
      hasOutlierDependency: true,
      createdAt: ctx.referenceTime,
    },
  ];

  return parseGeneratedList(BacktestResultSchema, results, 'backtests');
}

export function generateBacktestTrades(
  ctx: MockGeneratorContext,
  backtestId: string,
  count = 160,
): readonly BacktestTradeItem[] {
  const stream = ctx.random.fork(`backtest-trades:${backtestId}`);
  const isOutlierBt = backtestId === 'bt-03-outlier-dependent';
  const trades: BacktestTradeItem[] = [];

  for (let i = 1; i <= count; i++) {
    const isOutlier = isOutlierBt && (i === 12 || i === 88);
    const returnPct = isOutlier
      ? stream.float(120.0, 185.0)
      : isOutlierBt
        ? stream.float(-12.0, 14.0)
        : stream.float(-8.0, 18.0);

    const capitalAlloc = 10000;
    const pnl = Math.round((capitalAlloc * returnPct) / 100);

    trades.push({
      id: `trd-${backtestId}-${String(i).padStart(3, '0')}`,
      backtestId,
      instrumentSymbol: i % 2 === 0 ? 'AAPL' : 'NVDA',
      side: i % 3 === 0 ? 'sell' : 'buy',
      entryDate: `2024-${String(((i * 2) % 12) + 1).padStart(2, '0')}-05`,
      exitDate: `2024-${String(((i * 2) % 12) + 1).padStart(2, '0')}-18`,
      returnPercent: Math.round(returnPct * 100) / 100,
      pnlAmount: String(pnl),
      isOutlier,
    });
  }

  return trades;
}
