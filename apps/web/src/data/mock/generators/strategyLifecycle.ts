// Retirement criteria and recorded stage changes for the canonical strategies (M-17; requirements 28
// and 33; UI spec 19.4). RSI Oversold Mean Reversion decayed past its criteria and was demoted from
// fully automatic back to semi-automatic; its stage in generateStrategies is the result of that.
// Creation dates match generateStrategies. The demotion is placed relative to the mock clock.

import type { z } from 'zod';

import type { StrategyLifecycleListDto } from '../../schemas/strategy-lifecycle';
import { StrategyLifecycleListSchema } from '../../schemas/strategy-lifecycle';
import { toIsoDate } from '../../../shared/types/dateTime';
import { addDays } from './values';
import { parseGeneratedList } from './validated';

type LifecycleInput = z.input<typeof StrategyLifecycleListSchema>[number];
type ChangeInput = LifecycleInput['history'][number];

const DEMOTED_DAYS_AGO = 77;

function at(date: string): string {
  return `${date}T00:00:00Z`;
}

function promotion(
  date: string,
  from: ChangeInput['from'],
  to: ChangeInput['to'],
  reason: string,
): ChangeInput {
  return { at: at(date), from, to, kind: 'promotion', reason, measured: null };
}

export function generateStrategyLifecycles(today: string): StrategyLifecycleListDto {
  const demotedOn = String(addDays(toIsoDate(today), -DEMOTED_DAYS_AGO));
  const lifecycles: LifecycleInput[] = [
    {
      strategyId: 'strat-trend-momentum',
      criteria: {
        definedAt: at('2023-09-01'),
        definedAtStage: 'semi_automatic',
        maxDrawdownPercent: 18,
        minRollingSharpe: 0.6,
        rollingWindowDays: 90,
        maxUnderperformancePoints: 6,
        reviewEveryDays: 90,
      },
      history: [
        promotion('2023-04-10', null, 'draft', 'Created'),
        promotion('2023-05-02', 'draft', 'backtested', 'Ten-year backtest completed'),
        promotion('2023-06-15', 'backtested', 'observation', 'Backtest passed validation checks'),
        promotion(
          '2023-09-01',
          'observation',
          'semi_automatic',
          '75 days of signals matched the backtest',
        ),
        promotion(
          '2024-01-08',
          'semi_automatic',
          'fully_automatic',
          'Four months within all criteria',
        ),
      ],
      lastReviewedAt: at(String(addDays(toIsoDate(today), -20))),
    },
    {
      strategyId: 'strat-rsi-reversion',
      criteria: {
        definedAt: at('2024-02-12'),
        definedAtStage: 'semi_automatic',
        maxDrawdownPercent: 15,
        minRollingSharpe: 0.5,
        rollingWindowDays: 90,
        maxUnderperformancePoints: 5,
        reviewEveryDays: 60,
      },
      history: [
        promotion('2023-09-15', null, 'draft', 'Created'),
        promotion('2023-10-20', 'draft', 'backtested', 'Five-year backtest completed'),
        promotion('2023-12-01', 'backtested', 'observation', 'Backtest passed validation checks'),
        promotion(
          '2024-02-12',
          'observation',
          'semi_automatic',
          '70 days of signals matched the backtest',
        ),
        promotion(
          '2024-07-01',
          'semi_automatic',
          'fully_automatic',
          'Four months within all criteria',
        ),
        {
          at: at(demotedOn),
          from: 'fully_automatic',
          to: 'semi_automatic',
          kind: 'demotion',
          reason:
            'Rolling 90-day Sharpe fell below its floor and drawdown passed its ceiling; every trade now needs approval and open positions were closed',
          measured: { drawdownPercent: 17.8, rollingSharpe: 0.21, underperformancePoints: 9.4 },
        },
      ],
      lastReviewedAt: at(demotedOn),
    },
    {
      strategyId: 'strat-breakout-vol',
      criteria: {
        definedAt: at('2024-04-02'),
        definedAtStage: 'observation',
        maxDrawdownPercent: 20,
        minRollingSharpe: 0.4,
        rollingWindowDays: 120,
        maxUnderperformancePoints: 8,
        reviewEveryDays: 90,
      },
      history: [
        promotion('2024-01-20', null, 'draft', 'Created'),
        promotion('2024-02-15', 'draft', 'backtested', 'Eight-year backtest completed'),
        promotion('2024-04-02', 'backtested', 'observation', 'Backtest passed validation checks'),
      ],
      lastReviewedAt: at(String(addDays(toIsoDate(today), -41))),
    },
    {
      strategyId: 'strat-earnings-breakout',
      criteria: null,
      history: [
        promotion('2024-06-01', null, 'draft', 'Created'),
        promotion(
          '2024-07-10',
          'draft',
          'backtested',
          'Backtest completed; results depend on one outlier',
        ),
      ],
      lastReviewedAt: null,
    },
    {
      strategyId: 'strat-macro-regime',
      criteria: null,
      history: [promotion('2024-09-01', null, 'draft', 'Created')],
      lastReviewedAt: null,
    },
  ];
  return parseGeneratedList(StrategyLifecycleListSchema.element, lifecycles, 'strategy lifecycles');
}
