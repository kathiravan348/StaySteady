// Presenting risk limits (UI spec 7.14): value formatting, grouping, and how close a limit is.

import type { RiskLimitDto, RiskLimitGroupDto } from '../../../data/schemas';

export const GROUP_ORDER: readonly RiskLimitGroupDto[] = [
  'global',
  'market',
  'instrument_type',
  'strategy',
];

export const GROUP_TITLES: Readonly<Record<RiskLimitGroupDto, string>> = {
  global: 'Global',
  market: 'Per market',
  instrument_type: 'Per instrument type',
  strategy: 'Per strategy',
};

export const GROUP_DESCRIPTIONS: Readonly<Record<RiskLimitGroupDto, string>> = {
  global: 'Limits on the whole portfolio, whatever strategy or market a trade comes from.',
  market: 'How much of the holdings may sit in one market.',
  instrument_type: 'How much of the holdings may sit in one kind of instrument.',
  strategy: "The limits each strategy's own definition sets.",
};

export function formatLimitValue(limit: RiskLimitDto, value: number): string {
  if (limit.unit === 'percent') return `${value.toFixed(2)}%`;
  if (limit.unit === 'money') {
    return `${value.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${limit.currency ?? ''}`.trim();
  }
  if (limit.unit === 'minutes') return `${String(value)} min`;
  return String(value);
}

export type Closeness = 'unmeasured' | 'within' | 'near' | 'breached';

// Near means within the last 20% before a ceiling, or within 25% above a floor.
export function closenessOf(limit: RiskLimitDto): Closeness {
  if (limit.used === null) return 'unmeasured';
  if (limit.isBreached) return 'breached';
  if (limit.direction === 'minimum') {
    return limit.threshold > 0 && limit.used / limit.threshold < 1.25 ? 'near' : 'within';
  }
  return limit.threshold > 0 && limit.used / limit.threshold >= 0.8 ? 'near' : 'within';
}

// A floor is drawn as the reserve held back out of what is actually there, so the meter fills as
// cash falls towards the floor and its headroom is what can still be spent.
export function meterValues(limit: RiskLimitDto): { used: number; limit: number } | null {
  if (limit.used === null) return null;
  return limit.direction === 'minimum'
    ? { used: limit.threshold, limit: limit.used }
    : { used: limit.used, limit: limit.threshold };
}

export function groupLimits(
  limits: readonly RiskLimitDto[],
): readonly { readonly group: RiskLimitGroupDto; readonly limits: readonly RiskLimitDto[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    limits: limits.filter((limit) => limit.group === group),
  })).filter((entry) => entry.limits.length > 0);
}

// Strategies are listed together, one block per strategy.
export function byScope(
  limits: readonly RiskLimitDto[],
): readonly { readonly scope: string; readonly limits: readonly RiskLimitDto[] }[] {
  const scopes = [...new Set(limits.map((limit) => limit.scopeLabel))];
  return scopes.map((scope) => ({
    scope,
    limits: limits.filter((limit) => limit.scopeLabel === scope),
  }));
}
