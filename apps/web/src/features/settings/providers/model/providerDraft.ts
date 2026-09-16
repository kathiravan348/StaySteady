// Editing a data provider configuration (UI spec 7.18): a blank new provider, labels, the failover
// order a priority produces, the cost of using the whole limit, and a version described in the
// screen's own words for the diff.

import type {
  ProviderConfigInput,
  ProviderDataKindDto,
  ProviderGranularityDto,
} from '../../../../data/schemas';
import { ProviderDataKindSchema, ProviderGranularitySchema } from '../../../../data/schemas';
import { formatMoney } from '../../../../shared/format';
import type { Money } from '../../../../shared/money';
import { compareMoney, createMoney, divideMoney, multiplyMoney } from '../../../../shared/money';

const DATA_KIND_LABELS: Readonly<Record<ProviderDataKindDto, string>> = {
  prices: 'Daily prices',
  intraday: 'Intraday bars',
  fundamentals: 'Fundamentals',
  corporate_actions: 'Corporate actions',
  fx: 'FX rates',
  news: 'News',
};

const GRANULARITY_LABELS: Readonly<Record<ProviderGranularityDto, string>> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '1d': '1 day',
};

export const DATA_KIND_OPTIONS = ProviderDataKindSchema.options.map((value) => ({
  value,
  label: DATA_KIND_LABELS[value],
}));

export const GRANULARITY_OPTIONS = ProviderGranularitySchema.options.map((value) => ({
  value,
  label: GRANULARITY_LABELS[value],
}));

export const dataKindLabel = (kind: ProviderDataKindDto): string => DATA_KIND_LABELS[kind];

// Conservative where a real decision is not needed yet: a fallback priority, a credential expected,
// and simulation. Identity and coverage are left for the owner to fill in.
export function blankProvider(): ProviderConfigInput {
  return {
    providerId: 'prov-',
    name: '',
    coverage: { markets: [], dataKinds: [] },
    granularities: [],
    historyDepthYears: 5,
    rateLimits: { requestsPerMinute: 60, requestsPerMonth: 10_000 },
    cost: { currency: 'USD', monthlyBudget: '0.00', perThousandRequests: '0.00' },
    priority: 2,
    requiresCredential: true,
    credentialRef: 'vault://providers/',
    healthCheck: { intervalSeconds: 60, timeoutMs: 3000 },
    freshnessSeconds: 300,
    enabled: true,
    mode: 'simulation',
  };
}

export interface FailoverStep {
  readonly providerId: string;
  readonly name: string;
  readonly priority: number;
  readonly markets: readonly string[];
  readonly isThis: boolean;
}

export interface FailoverChain {
  readonly kind: ProviderDataKindDto;
  readonly steps: readonly FailoverStep[];
  // Markets this provider covers for the kind that no other live provider can take over.
  readonly withoutFallback: readonly string[];
  // Live providers at the same priority for this kind and an overlapping market.
  readonly tiedWith: readonly string[];
}

// What asking order the draft's priority produces for each kind of data it provides, with the draft
// standing in for its saved version. Only live, enabled providers are asked for data; a draft in
// simulation is shown where it would sit once live.
export function failoverChains(
  draft: ProviderConfigInput,
  saved: readonly ProviderConfigInput[],
): readonly FailoverChain[] {
  const others = saved.filter(
    (item) => item.providerId !== draft.providerId && item.enabled && item.mode === 'live',
  );
  return draft.coverage.dataKinds.map((kind) => {
    const steps = [...others, draft]
      .filter((item) => item.coverage.dataKinds.includes(kind))
      .map((item) => ({
        providerId: item.providerId,
        name: item.providerId === draft.providerId ? item.name || 'This provider' : item.name,
        priority: item.priority,
        markets: item.coverage.markets,
        isThis: item === draft,
      }))
      .sort((a, b) => a.priority - b.priority);
    const withoutFallback = draft.coverage.markets.filter(
      (market) =>
        !others.some(
          (item) =>
            item.coverage.dataKinds.includes(kind) && item.coverage.markets.includes(market),
        ),
    );
    const tiedWith = others
      .filter(
        (item) =>
          item.priority === draft.priority &&
          item.coverage.dataKinds.includes(kind) &&
          item.coverage.markets.some((market) => draft.coverage.markets.includes(market)),
      )
      .map((item) => item.name);
    return { kind, steps, withoutFallback, tiedWith };
  });
}

const AMOUNT = /^\d+(\.\d{1,4})?$/;

export interface FullUseCost {
  readonly cost: Money;
  readonly budget: Money;
  readonly overBudget: boolean;
}

// The cost of using every request the monthly limit allows. Exceeding the budget is allowed (few
// months use the whole limit), so the form states it rather than rejecting it.
export function fullUseCost(draft: ProviderConfigInput): FullUseCost | null {
  const { monthlyBudget, perThousandRequests, currency } = draft.cost;
  const requests = draft.rateLimits.requestsPerMonth;
  if (!AMOUNT.test(monthlyBudget) || !AMOUNT.test(perThousandRequests)) return null;
  if (!Number.isInteger(requests) || requests <= 0) return null;
  const cost = divideMoney(
    multiplyMoney(createMoney(perThousandRequests, currency), requests),
    1000,
  );
  const budget = createMoney(monthlyBudget, currency);
  return { cost, budget, overBudget: compareMoney(cost, budget) > 0 };
}

const labelList = (values: readonly string[]): string => values.join(', ') || 'None';
const describeSeconds = (seconds: number): string =>
  seconds < 120 ? `${String(seconds)} s` : `${String(Math.round(seconds / 60))} min`;

export function describeProvider(config: ProviderConfigInput): Record<string, string> {
  return {
    Name: config.name,
    Markets: labelList(config.coverage.markets),
    Data: labelList(config.coverage.dataKinds.map(dataKindLabel)),
    Granularity: labelList(config.granularities.map((item) => GRANULARITY_LABELS[item])),
    'History depth': `${String(config.historyDepthYears)} years`,
    'Requests per minute': String(config.rateLimits.requestsPerMinute),
    'Requests per month': config.rateLimits.requestsPerMonth.toLocaleString('en-US'),
    'Monthly budget': AMOUNT.test(config.cost.monthlyBudget)
      ? formatMoney(createMoney(config.cost.monthlyBudget, config.cost.currency))
      : config.cost.monthlyBudget,
    'Cost per 1,000 requests': `${config.cost.perThousandRequests} ${config.cost.currency}`,
    Priority: String(config.priority),
    'Credential reference': config.credentialRef ?? 'None needed',
    'Health check': `Every ${describeSeconds(config.healthCheck.intervalSeconds)}, ${String(config.healthCheck.timeoutMs)} ms timeout`,
    'Freshness expectation': `Within ${describeSeconds(config.freshnessSeconds)}`,
    Enabled: config.enabled ? 'Yes' : 'No',
    Mode: config.mode === 'live' ? 'Live' : 'Simulation',
  };
}
