// Strategy definitions for the editor (UI spec 7.8). Each existing strategy gets a rule tree that
// matches the description the rest of the app already shows, so opening one in the editor explains
// what it actually does. The draft strategy is left deliberately incomplete to exercise validation.

import type { z } from 'zod';

import type { StrategyDraftDto, StrategyVersionDto } from '../../schemas';
import { StrategyDraftSchema, StrategyVersionSchema, type RuleGroupDto } from '../../schemas';
import type { MockGeneratorContext } from './mockContext';
import { cond, group, ind, num, price } from './ruleBuilders';
import { generateStrategies } from './trading';
import { parseGenerated } from './validated';

type DraftInput = z.input<typeof StrategyDraftSchema>;

const NO_FORCED_EXIT = { maxLossPercent: null, maxHoldingDays: null, trailingStopPercent: null };
const NO_NEWS = {
  isEnabled: false,
  blockAroundHighImpactEvents: false,
  blockWindowHours: 24,
  minimumSentiment: null,
};
const NO_RISK = { maxDailyLossPercent: null, maxLeverage: null };

// Rule trees per strategy id. Anything not listed here opens as an empty definition.
function rulesFor(strategyId: string): { entry: RuleGroupDto; exit: RuleGroupDto } {
  switch (strategyId) {
    case 'strat-trend-momentum':
      return {
        entry: group('e-root', 'all', [
          cond('e1', ind('ema', 20), 'crosses_above', ind('ema', 50)),
          cond('e2', price('close'), 'greater_than', ind('sma', 200)),
        ]),
        exit: group('x-root', 'any', [
          cond('x1', ind('ema', 20), 'crosses_below', ind('ema', 50)),
          cond('x2', ind('rsi', 14), 'greater_than', num(78)),
        ]),
      };
    case 'strat-rsi-reversion':
      return {
        entry: group('e-root', 'all', [
          cond('e1', ind('rsi', 14), 'less_than', num(28)),
          group('e-vol', 'any', [
            cond('e2', price('volume'), 'greater_than', ind('sma', 20)),
            cond('e3', price('close'), 'less_than', ind('bollinger_lower', 20)),
          ]),
        ]),
        exit: group('x-root', 'any', [
          cond('x1', ind('rsi', 14), 'crosses_above', num(55)),
          cond('x2', price('close'), 'greater_than', ind('bollinger_upper', 20)),
        ]),
      };
    case 'strat-breakout-vol':
      return {
        entry: group('e-root', 'all', [
          cond('e1', price('close'), 'crosses_above', ind('bollinger_upper', 20)),
          cond('e2', ind('atr', 14), 'greater_than', num(0)),
        ]),
        exit: group('x-root', 'any', [cond('x1', price('close'), 'crosses_below', ind('sma', 20))]),
      };
    case 'strat-earnings-breakout':
      return {
        entry: group('e-root', 'all', [
          cond('e1', price('close'), 'crosses_above', ind('sma', 10)),
          cond('e2', ind('stochastic_k', 14), 'greater_than', num(60)),
        ]),
        exit: group('x-root', 'any', [
          cond('x1', ind('stochastic_k', 14), 'crosses_below', num(40)),
        ]),
      };
    default:
      // The macro rotation strategy is still a draft: no rules written yet.
      return { entry: group('e-root', 'all', []), exit: group('x-root', 'any', []) };
  }
}

function settingsFor(
  strategyId: string,
): Pick<DraftInput, 'forcedExit' | 'sizing' | 'allocation' | 'holdingPeriod' | 'news' | 'risk'> {
  switch (strategyId) {
    case 'strat-trend-momentum':
      return {
        forcedExit: { maxLossPercent: 8, maxHoldingDays: 120, trailingStopPercent: 12 },
        sizing: { method: 'percent_of_capital', value: 10, maxPositionPercent: 15 },
        allocation: { maxCapitalPercent: 50, maxConcurrentPositions: 4 },
        holdingPeriod: { expectedDays: 45, minDays: 5, maxDays: 120 },
        news: { ...NO_NEWS },
        risk: { maxDailyLossPercent: 3, maxLeverage: 1 },
      };
    case 'strat-rsi-reversion':
      return {
        forcedExit: { maxLossPercent: 5, maxHoldingDays: 15, trailingStopPercent: null },
        sizing: { method: 'risk_based', value: 1, maxPositionPercent: 8 },
        allocation: { maxCapitalPercent: 30, maxConcurrentPositions: 6 },
        holdingPeriod: { expectedDays: 6, minDays: 1, maxDays: 15 },
        news: { ...NO_NEWS },
        risk: { maxDailyLossPercent: 2, maxLeverage: 1 },
      };
    case 'strat-breakout-vol':
      return {
        forcedExit: { maxLossPercent: 10, maxHoldingDays: null, trailingStopPercent: 15 },
        sizing: { method: 'risk_based', value: 1, maxPositionPercent: 10 },
        allocation: { maxCapitalPercent: 25, maxConcurrentPositions: 3 },
        holdingPeriod: { expectedDays: 30, minDays: 2, maxDays: 90 },
        news: { ...NO_NEWS },
        risk: { maxDailyLossPercent: null, maxLeverage: null },
      };
    case 'strat-earnings-breakout':
      return {
        forcedExit: { maxLossPercent: 6, maxHoldingDays: 10, trailingStopPercent: null },
        sizing: { method: 'fixed_amount', value: 5000, maxPositionPercent: 10 },
        allocation: { maxCapitalPercent: 20, maxConcurrentPositions: 2 },
        holdingPeriod: { expectedDays: 10, minDays: 1, maxDays: 10 },
        // The only strategy that reads news, because it trades a scheduled catalyst.
        news: {
          isEnabled: true,
          blockAroundHighImpactEvents: true,
          blockWindowHours: 48,
          minimumSentiment: 0.2,
        },
        risk: { maxDailyLossPercent: 2, maxLeverage: 1 },
      };
    default:
      return {
        forcedExit: { ...NO_FORCED_EXIT },
        sizing: { method: 'percent_of_capital', value: 0, maxPositionPercent: 0 },
        allocation: { maxCapitalPercent: 0, maxConcurrentPositions: 0 },
        holdingPeriod: { expectedDays: 0, minDays: 0, maxDays: 0 },
        news: { ...NO_NEWS },
        risk: { ...NO_RISK },
      };
  }
}

export function generateStrategyDraft(
  ctx: MockGeneratorContext,
  strategyId: string,
): StrategyDraftDto | undefined {
  const strategy = generateStrategies(ctx).find((item) => String(item.id) === strategyId);
  if (strategy === undefined) return undefined;
  const rules = rulesFor(strategyId);

  const draft: DraftInput = {
    strategyId: strategy.id,
    name: strategy.name,
    description: strategy.description,
    version: strategy.version,
    stage: strategy.stage,
    timeframe: strategy.timeframe,
    scope: {
      marketIds: [],
      instrumentTypes: [],
      instrumentIds: [...strategy.universe],
    },
    entry: rules.entry,
    exit: rules.exit,
    ...settingsFor(strategyId),
    updatedAt: ctx.referenceTime,
  };
  return parseGenerated(StrategyDraftSchema, draft, `StrategyDraft(${strategyId})`);
}

// An earlier version of the momentum strategy, so compare and revert have something real to show.
function previousDraft(current: StrategyDraftDto): StrategyDraftDto {
  return {
    ...current,
    version: '1.2.0',
    entry: group('e-root', 'all', [cond('e1', ind('ema', 12), 'crosses_above', ind('ema', 26))]),
    forcedExit: { ...current.forcedExit, maxLossPercent: 12, trailingStopPercent: null },
    sizing: { ...current.sizing, value: 15, maxPositionPercent: 20 },
    allocation: { ...current.allocation, maxCapitalPercent: 60 },
  };
}

export function generateStrategyVersions(
  ctx: MockGeneratorContext,
  strategyId: string,
): readonly StrategyVersionDto[] {
  const current = generateStrategyDraft(ctx, strategyId);
  if (current === undefined) return [];
  const savedAt = new Date(new Date(String(ctx.referenceTime)).getTime() - 86_400_000 * 30);

  const versions: z.input<typeof StrategyVersionSchema>[] = [
    {
      version: current.version,
      savedAt: ctx.referenceTime,
      summary: 'Current definition.',
      draft: current,
    },
  ];
  if (strategyId === 'strat-trend-momentum') {
    versions.push({
      version: '1.2.0',
      savedAt: savedAt.toISOString(),
      summary: 'Faster EMA pair, wider stop, more capital per position.',
      draft: previousDraft(current),
    });
  }
  return versions.map((version, index) =>
    parseGenerated(StrategyVersionSchema, version, `StrategyVersion[${String(index)}]`),
  );
}
