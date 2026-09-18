// Starter templates for a new strategy (UI spec 7.8). Each is a common, well-understood idea written
// as rules the editor can show and change, with sizing and forced exits already coherent, so a new
// strategy passes validation before anything is edited. None is a recommendation.

import type { StrategyTemplateDto } from '../../schemas';
import { StrategyTemplateSchema } from '../../schemas';
import { cond, group, ind, num, price } from './ruleBuilders';
import { parseGeneratedList } from './validated';

const MODEST_SIZING = { method: 'percent_of_capital', value: 10, maxPositionPercent: 15 } as const;
const MODEST_ALLOCATION = { maxCapitalPercent: 25, maxConcurrentPositions: 4 };

const TEMPLATES: StrategyTemplateDto[] = [
  {
    id: 'tpl-trend-following',
    name: 'Trend following',
    idea: 'Buy when a faster average moves above a slower one while the price is above its long-term average; sell when the fast average falls back.',
    suitsLabel: 'Liquid shares and ETFs that trend for weeks or months',
    timeframe: '1d',
    entry: group('e-root', 'all', [
      cond('e1', ind('ema', 20), 'crosses_above', ind('ema', 50)),
      cond('e2', price('close'), 'greater_than', ind('sma', 200)),
    ]),
    exit: group('x-root', 'any', [cond('x1', ind('ema', 20), 'crosses_below', ind('ema', 50))]),
    forcedExit: { maxLossPercent: 8, maxHoldingDays: 180, trailingStopPercent: 12 },
    sizing: { ...MODEST_SIZING },
    allocation: { ...MODEST_ALLOCATION },
    holdingPeriod: { expectedDays: 40, minDays: 5, maxDays: 180 },
  },
  {
    id: 'tpl-oversold-bounce',
    name: 'Oversold bounce',
    idea: 'Buy after a sharp fall, when RSI drops below 30 while the long-term trend is still up; sell once RSI recovers to 55.',
    suitsLabel: 'Large, steady companies that tend to recover from short sell-offs',
    timeframe: '1d',
    entry: group('e-root', 'all', [
      cond('e1', ind('rsi', 14), 'less_than', num(30)),
      cond('e2', price('close'), 'greater_than', ind('sma', 200)),
    ]),
    exit: group('x-root', 'any', [cond('x1', ind('rsi', 14), 'crosses_above', num(55))]),
    forcedExit: { maxLossPercent: 6, maxHoldingDays: 20, trailingStopPercent: null },
    sizing: { ...MODEST_SIZING },
    allocation: { ...MODEST_ALLOCATION },
    holdingPeriod: { expectedDays: 8, minDays: 1, maxDays: 20 },
  },
  {
    id: 'tpl-breakout',
    name: 'Volatility breakout',
    idea: 'Buy when the price closes above its upper Bollinger band, a sign of a new move starting; sell when it closes back below the 20-day average.',
    suitsLabel: 'Instruments that move in bursts, such as commodities and growth shares',
    timeframe: '1d',
    entry: group('e-root', 'all', [
      cond('e1', price('close'), 'crosses_above', ind('bollinger_upper', 20)),
    ]),
    exit: group('x-root', 'any', [cond('x1', price('close'), 'crosses_below', ind('sma', 20))]),
    forcedExit: { maxLossPercent: 7, maxHoldingDays: 60, trailingStopPercent: 10 },
    sizing: { ...MODEST_SIZING },
    allocation: { ...MODEST_ALLOCATION },
    holdingPeriod: { expectedDays: 15, minDays: 2, maxDays: 60 },
  },
  {
    id: 'tpl-golden-cross',
    name: 'Long-term golden cross',
    idea: 'Buy when the 50-day average rises above the 200-day average and hold until it falls back below. Trades rarely.',
    suitsLabel: 'Broad index ETFs held for the long term',
    timeframe: '1d',
    entry: group('e-root', 'all', [cond('e1', ind('sma', 50), 'crosses_above', ind('sma', 200))]),
    exit: group('x-root', 'any', [cond('x1', ind('sma', 50), 'crosses_below', ind('sma', 200))]),
    forcedExit: { maxLossPercent: 15, maxHoldingDays: null, trailingStopPercent: null },
    sizing: { method: 'percent_of_capital', value: 20, maxPositionPercent: 25 },
    allocation: { maxCapitalPercent: 40, maxConcurrentPositions: 2 },
    holdingPeriod: { expectedDays: 250, minDays: 30, maxDays: 1000 },
  },
];

export function generateStrategyTemplates(): readonly StrategyTemplateDto[] {
  return parseGeneratedList(StrategyTemplateSchema, TEMPLATES, 'StrategyTemplate');
}
