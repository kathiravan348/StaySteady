// Shorthand for writing rule trees in mock data: seeded strategy drafts and starter templates.

import type {
  ComparatorDto,
  IndicatorKindDto,
  PriceFieldDto,
  RuleConditionDto,
  RuleGroupDto,
  RuleOperandDto,
} from '../../schemas';

export const price = (field: PriceFieldDto): RuleOperandDto => ({ kind: 'price', field });

export const ind = (indicator: IndicatorKindDto, period: number): RuleOperandDto => ({
  kind: 'indicator',
  indicator,
  period,
});

export const num = (value: number): RuleOperandDto => ({ kind: 'number', value });

export const cond = (
  id: string,
  left: RuleOperandDto,
  comparator: ComparatorDto,
  right: RuleOperandDto,
): RuleConditionDto => ({ id, node: 'condition', left, comparator, right });

export const group = (
  id: string,
  combinator: 'all' | 'any',
  children: (RuleConditionDto | RuleGroupDto)[],
): RuleGroupDto => ({ id, node: 'group', combinator, children });
