// Editing the rule tree (UI spec 7.8): add, group and nest. Every operation returns a new tree, so
// the editor can keep the previous one for undo and version comparison.

import type {
  ComparatorDto,
  IndicatorKindDto,
  RuleConditionDto,
  RuleGroupDto,
  RuleNodeDto,
  RuleOperandDto,
} from '../../../../data/schemas';

export const COMPARATOR_LABELS: Readonly<Record<ComparatorDto, string>> = {
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
  greater_than: 'is greater than',
  less_than: 'is less than',
};

export const INDICATOR_LABELS: Readonly<Record<IndicatorKindDto, string>> = {
  sma: 'Simple moving average',
  ema: 'Exponential moving average',
  rsi: 'RSI',
  macd: 'MACD',
  atr: 'Average true range',
  stochastic_k: 'Stochastic %K',
  bollinger_upper: 'Bollinger upper band',
  bollinger_lower: 'Bollinger lower band',
  volume_sma: 'Average volume',
};

// Indicators bounded to a known range, so a threshold outside it can be called impossible.
export const INDICATOR_RANGE: Partial<Readonly<Record<IndicatorKindDto, [number, number]>>> = {
  rsi: [0, 100],
  stochastic_k: [0, 100],
};

// What an operand is measured in. Comparing two different units (a share count with a price, an
// RSI reading with a price) is never meaningful, whatever the numbers happen to be.
export type OperandScale = 'price' | 'volume' | 'oscillator' | 'distance' | 'number';

const INDICATOR_SCALE: Readonly<Record<IndicatorKindDto, OperandScale>> = {
  sma: 'price',
  ema: 'price',
  bollinger_upper: 'price',
  bollinger_lower: 'price',
  rsi: 'oscillator',
  stochastic_k: 'oscillator',
  macd: 'distance',
  atr: 'distance',
  volume_sma: 'volume',
};

export const SCALE_LABELS: Readonly<Record<OperandScale, string>> = {
  price: 'a price',
  volume: 'a number of shares traded',
  oscillator: 'a 0 to 100 reading',
  distance: 'a price distance',
  number: 'a fixed number',
};

export function operandScale(operand: RuleOperandDto): OperandScale {
  if (operand.kind === 'number') return 'number';
  if (operand.kind === 'price') return operand.field === 'volume' ? 'volume' : 'price';
  return INDICATOR_SCALE[operand.indicator];
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${String(Date.now())}-${String(counter)}`;
}

export function describeOperand(operand: RuleOperandDto): string {
  if (operand.kind === 'price') return `Price ${operand.field}`;
  if (operand.kind === 'number') return String(operand.value);
  return `${INDICATOR_LABELS[operand.indicator]} (${String(operand.period)})`;
}

export function describeCondition(condition: RuleConditionDto): string {
  return `${describeOperand(condition.left)} ${COMPARATOR_LABELS[condition.comparator]} ${describeOperand(condition.right)}`;
}

export function newCondition(): RuleConditionDto {
  return {
    id: nextId('c'),
    node: 'condition',
    left: { kind: 'price', field: 'close' },
    comparator: 'crosses_above',
    right: { kind: 'indicator', indicator: 'sma', period: 20 },
  };
}

export function newGroup(): RuleGroupDto {
  return { id: nextId('g'), node: 'group', combinator: 'all', children: [newCondition()] };
}

function mapChildren(
  group: RuleGroupDto,
  change: (children: RuleNodeDto[]) => RuleNodeDto[],
): RuleGroupDto {
  return { ...group, children: change(group.children) };
}

// Each operation walks the tree and rebuilds only the branch that contains the target.
function updateNode(
  node: RuleNodeDto,
  targetId: string,
  change: (node: RuleGroupDto) => RuleGroupDto,
): RuleNodeDto {
  if (node.node === 'condition') return node;
  if (node.id === targetId) return change(node);
  return mapChildren(node, (children) =>
    children.map((child) => updateNode(child, targetId, change)),
  );
}

export function addCondition(root: RuleGroupDto, groupId: string): RuleGroupDto {
  return updateNode(root, groupId, (group) =>
    mapChildren(group, (children) => [...children, newCondition()]),
  ) as RuleGroupDto;
}

export function addGroup(root: RuleGroupDto, groupId: string): RuleGroupDto {
  return updateNode(root, groupId, (group) =>
    mapChildren(group, (children) => [...children, newGroup()]),
  ) as RuleGroupDto;
}

export function setCombinator(
  root: RuleGroupDto,
  groupId: string,
  combinator: RuleGroupDto['combinator'],
): RuleGroupDto {
  return updateNode(root, groupId, (group) => ({ ...group, combinator })) as RuleGroupDto;
}

function removeFrom(node: RuleNodeDto, targetId: string): RuleNodeDto {
  if (node.node === 'condition') return node;
  return mapChildren(node, (children) =>
    children.filter((child) => child.id !== targetId).map((child) => removeFrom(child, targetId)),
  );
}

export function removeNode(root: RuleGroupDto, targetId: string): RuleGroupDto {
  return removeFrom(root, targetId) as RuleGroupDto;
}

function replaceCondition(node: RuleNodeDto, updated: RuleConditionDto): RuleNodeDto {
  if (node.node === 'condition') return node.id === updated.id ? updated : node;
  return mapChildren(node, (children) => children.map((child) => replaceCondition(child, updated)));
}

export function updateCondition(root: RuleGroupDto, updated: RuleConditionDto): RuleGroupDto {
  return replaceCondition(root, updated) as RuleGroupDto;
}

export function countConditions(node: RuleNodeDto): number {
  return node.node === 'condition'
    ? 1
    : node.children.reduce((sum, child) => sum + countConditions(child), 0);
}

export function allConditions(node: RuleNodeDto): readonly RuleConditionDto[] {
  return node.node === 'condition' ? [node] : node.children.flatMap(allConditions);
}
