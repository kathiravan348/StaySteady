// Live validation (UI spec 7.8): conflicts, impossible conditions and missing settings. Each issue
// says what is wrong and what it would mean if the strategy ran as written.

import type { RuleConditionDto, RuleOperandDto, StrategyDraftDto } from '../../../../data/schemas';
import { INDICATOR_RANGE, allConditions, countConditions, describeCondition } from './ruleTree';

export type IssueSeverity = 'conflict' | 'impossible' | 'missing';

export interface ValidationIssue {
  readonly id: string;
  readonly severity: IssueSeverity;
  readonly section: string;
  readonly title: string;
  readonly detail: string;
}

export const SEVERITY_LABELS: Readonly<Record<IssueSeverity, string>> = {
  conflict: 'Conflict',
  impossible: 'Impossible',
  missing: 'Missing',
};

function sameOperand(left: RuleOperandDto, right: RuleOperandDto): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

// A threshold outside an indicator's own range can never be crossed.
function impossibleThreshold(condition: RuleConditionDto): string | null {
  const pairs: [RuleOperandDto, RuleOperandDto][] = [
    [condition.left, condition.right],
    [condition.right, condition.left],
  ];
  for (const [indicatorSide, numberSide] of pairs) {
    if (indicatorSide?.kind !== 'indicator' || numberSide?.kind !== 'number') continue;
    const range = INDICATOR_RANGE[indicatorSide.indicator];
    if (range === undefined) continue;
    const [min, max] = range;
    if (numberSide.value < min || numberSide.value > max) {
      return `${describeCondition(condition)} — that indicator only ever reads between ${String(min)} and ${String(max)}.`;
    }
  }
  return null;
}

function ruleIssues(draft: StrategyDraftDto): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entryConditions = allConditions(draft.entry);
  const exitConditions = allConditions(draft.exit);

  if (countConditions(draft.entry) === 0) {
    issues.push({
      id: 'entry-empty',
      severity: 'missing',
      section: 'Entry conditions',
      title: 'No entry conditions',
      detail: 'The strategy can never open a position, so it would generate nothing.',
    });
  }
  if (countConditions(draft.exit) === 0 && draft.forcedExit.maxHoldingDays === null) {
    issues.push({
      id: 'exit-empty',
      severity: 'missing',
      section: 'Exit conditions',
      title: 'Nothing can close a position',
      detail:
        'There are no exit conditions and no maximum holding period, so a position once opened would be held indefinitely.',
    });
  }

  for (const condition of [...entryConditions, ...exitConditions]) {
    if (sameOperand(condition.left, condition.right)) {
      issues.push({
        id: `same-${condition.id}`,
        severity: 'impossible',
        section: 'Conditions',
        title: 'A condition compares a value with itself',
        detail: `${describeCondition(condition)} can never be true.`,
      });
    }
    if (condition.left.kind === 'number' && condition.right.kind === 'number') {
      issues.push({
        id: `const-${condition.id}`,
        severity: 'impossible',
        section: 'Conditions',
        title: 'A condition compares two fixed numbers',
        detail: `${describeCondition(condition)} does not depend on the market, so it is always true or always false.`,
      });
    }
    const threshold = impossibleThreshold(condition);
    if (threshold !== null) {
      issues.push({
        id: `range-${condition.id}`,
        severity: 'impossible',
        section: 'Conditions',
        title: 'A threshold is outside the indicator range',
        detail: threshold,
      });
    }
  }

  // Entering and exiting on the identical condition means a position closes as soon as it opens.
  for (const entry of entryConditions) {
    const clash = exitConditions.find(
      (exit) =>
        exit.comparator === entry.comparator &&
        sameOperand(exit.left, entry.left) &&
        sameOperand(exit.right, entry.right),
    );
    if (clash !== undefined) {
      issues.push({
        id: `clash-${entry.id}`,
        severity: 'conflict',
        section: 'Entry and exit',
        title: 'The same condition both opens and closes a position',
        detail: `${describeCondition(entry)} appears in entry and in exit, so a position would close the moment it opens.`,
      });
    }
  }
  return issues;
}

function settingIssues(draft: StrategyDraftDto): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { scope, sizing, allocation, holdingPeriod, forcedExit, news, risk } = draft;

  if (scope.instrumentIds.length === 0) {
    issues.push({
      id: 'scope-empty',
      severity: 'missing',
      section: 'Scope',
      title: 'No instruments selected',
      detail: 'The strategy has nothing to trade until at least one instrument is in scope.',
    });
  }
  if (sizing.value <= 0) {
    issues.push({
      id: 'sizing-zero',
      severity: 'missing',
      section: 'Position sizing',
      title: 'Position size is zero',
      detail: 'Every position would be of zero size, so no order could be placed.',
    });
  }
  if (allocation.maxCapitalPercent <= 0) {
    issues.push({
      id: 'allocation-zero',
      severity: 'missing',
      section: 'Capital allocation',
      title: 'No capital allocated',
      detail: 'The strategy is allowed 0% of capital, so it can never take a position.',
    });
  }
  if (allocation.maxConcurrentPositions <= 0) {
    issues.push({
      id: 'concurrent-zero',
      severity: 'missing',
      section: 'Capital allocation',
      title: 'No concurrent positions allowed',
      detail: 'A limit of zero open positions prevents the strategy from ever opening one.',
    });
  }
  if (sizing.maxPositionPercent > allocation.maxCapitalPercent) {
    issues.push({
      id: 'sizing-exceeds-allocation',
      severity: 'conflict',
      section: 'Position sizing',
      title: 'One position may exceed the whole allocation',
      detail: `A single position may reach ${String(sizing.maxPositionPercent)}% of capital while the strategy is allowed ${String(allocation.maxCapitalPercent)}% in total.`,
    });
  }
  if (holdingPeriod.minDays > holdingPeriod.maxDays) {
    issues.push({
      id: 'holding-inverted',
      severity: 'impossible',
      section: 'Holding period',
      title: 'Minimum holding period exceeds the maximum',
      detail: `Held at least ${String(holdingPeriod.minDays)} days but at most ${String(holdingPeriod.maxDays)} days cannot both be satisfied.`,
    });
  } else if (
    holdingPeriod.expectedDays < holdingPeriod.minDays ||
    holdingPeriod.expectedDays > holdingPeriod.maxDays
  ) {
    issues.push({
      id: 'holding-expected',
      severity: 'conflict',
      section: 'Holding period',
      title: 'Expected holding period falls outside the allowed range',
      detail: `Expected ${String(holdingPeriod.expectedDays)} days, but the range is ${String(holdingPeriod.minDays)} to ${String(holdingPeriod.maxDays)} days.`,
    });
  }
  if (forcedExit.maxHoldingDays !== null && forcedExit.maxHoldingDays < holdingPeriod.minDays) {
    issues.push({
      id: 'forced-before-min',
      severity: 'conflict',
      section: 'Forced exits',
      title: 'The forced exit fires before the minimum holding period',
      detail: `Positions are forced out after ${String(forcedExit.maxHoldingDays)} days but are meant to be held at least ${String(holdingPeriod.minDays)}.`,
    });
  }
  // A trailing stop measures from the running peak and a hard stop from entry, so a wider trailing
  // stop is not a conflict. What is worth saying is when nothing caps the downside at all.
  if (
    forcedExit.maxLossPercent === null &&
    forcedExit.trailingStopPercent === null &&
    countConditions(draft.exit) === 0
  ) {
    issues.push({
      id: 'no-downside-cap',
      severity: 'missing',
      section: 'Forced exits',
      title: 'Nothing limits the loss on a position',
      detail:
        'There is no stop loss, no trailing stop and no exit condition, so a losing position has nothing to close it.',
    });
  }
  if (!news.isEnabled && news.minimumSentiment !== null) {
    issues.push({
      id: 'news-inert',
      severity: 'conflict',
      section: 'News and events',
      title: 'A sentiment floor is set but news inputs are off',
      detail: 'The sentiment floor is ignored while news inputs are disabled.',
    });
  }
  if (risk.maxLeverage !== null && risk.maxLeverage < 1) {
    issues.push({
      id: 'leverage-low',
      severity: 'impossible',
      section: 'Risk overrides',
      title: 'Maximum leverage below 1',
      detail: 'Leverage under 1 would prevent the strategy from using its own allocated capital.',
    });
  }
  return issues;
}

export function validateDraft(draft: StrategyDraftDto): readonly ValidationIssue[] {
  return [...ruleIssues(draft), ...settingIssues(draft)];
}

export function countBySeverity(
  issues: readonly ValidationIssue[],
): Readonly<Record<IssueSeverity, number>> {
  return {
    conflict: issues.filter((issue) => issue.severity === 'conflict').length,
    impossible: issues.filter((issue) => issue.severity === 'impossible').length,
    missing: issues.filter((issue) => issue.severity === 'missing').length,
  };
}
