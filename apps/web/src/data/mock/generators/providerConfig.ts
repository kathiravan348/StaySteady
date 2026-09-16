// Data provider configuration seeds and health (UI spec 7.18). Request
// limits, budgets, freshness expectations and faults come from the System Health sources, so a
// provider reads the same on both screens.

import { Decimal } from 'decimal.js';

import type { ConfigHealthDto, ProviderConfigInput } from '../../schemas';
import { RELIABILITY_SOURCES } from './healthHistoryData';
import { FAULTS, FRESHNESS, FRESHNESS_DELAYS } from './healthMonitorData';

const ALL_MARKETS = ['US', 'IN', 'UK', 'JP', 'SG'];
const WARN_AT = 0.8;
const CRITICAL_AT = 0.95;

interface ProviderSeed extends Omit<
  ProviderConfigInput,
  'rateLimits' | 'freshnessSeconds' | 'enabled' | 'mode'
> {
  readonly requestsPerMinute: number;
}

const SEEDS: readonly ProviderSeed[] = [
  {
    providerId: 'prov-primary',
    name: 'Primary market data provider',
    coverage: {
      markets: ALL_MARKETS,
      dataKinds: ['prices', 'intraday', 'corporate_actions', 'fundamentals'],
    },
    granularities: ['1m', '5m', '15m', '1h', '1d'],
    historyDepthYears: 20,
    requestsPerMinute: 1000,
    cost: { currency: 'USD', monthlyBudget: '400.00', perThousandRequests: '0.80' },
    priority: 1,
    requiresCredential: true,
    credentialRef: 'vault://providers/primary-market-data',
    healthCheck: { intervalSeconds: 30, timeoutMs: 2000 },
  },
  {
    providerId: 'prov-backup',
    name: 'Backup market data provider',
    coverage: { markets: ['US', 'IN', 'UK'], dataKinds: ['prices', 'intraday'] },
    granularities: ['5m', '1h', '1d'],
    historyDepthYears: 10,
    requestsPerMinute: 200,
    cost: { currency: 'USD', monthlyBudget: '120.00', perThousandRequests: '1.20' },
    priority: 2,
    requiresCredential: true,
    credentialRef: 'vault://providers/backup-market-data',
    healthCheck: { intervalSeconds: 60, timeoutMs: 3000 },
  },
  {
    providerId: 'prov-fx',
    name: 'FX rates provider',
    coverage: { markets: ALL_MARKETS, dataKinds: ['fx'] },
    granularities: ['1h', '1d'],
    historyDepthYears: 25,
    requestsPerMinute: 60,
    cost: { currency: 'USD', monthlyBudget: '60.00', perThousandRequests: '1.20' },
    priority: 1,
    // Published reference rates need no key.
    requiresCredential: false,
    credentialRef: null,
    healthCheck: { intervalSeconds: 300, timeoutMs: 5000 },
  },
  {
    providerId: 'prov-news',
    name: 'News wire provider',
    coverage: { markets: ['US', 'IN', 'UK'], dataKinds: ['news'] },
    granularities: [],
    historyDepthYears: 3,
    requestsPerMinute: 30,
    cost: { currency: 'USD', monthlyBudget: '90.00', perThousandRequests: '4.50' },
    priority: 1,
    requiresCredential: true,
    credentialRef: 'vault://providers/news-wire',
    healthCheck: { intervalSeconds: 120, timeoutMs: 5000 },
  },
];

// References the mock credential store holds. Values are never stored or shown anywhere.
export const KNOWN_REFERENCES: ReadonlySet<string | null> = new Set(
  SEEDS.map((seed) => seed.credentialRef),
);

export function seedProviderConfigs(): readonly ProviderConfigInput[] {
  return SEEDS.map(({ requestsPerMinute, ...seed }) => {
    const source = RELIABILITY_SOURCES.find((item) => item.id === seed.providerId);
    const freshness = FRESHNESS.find((item) => item.id === seed.providerId);
    return {
      ...seed,
      coverage: { markets: [...seed.coverage.markets], dataKinds: [...seed.coverage.dataKinds] },
      granularities: [...seed.granularities],
      rateLimits: { requestsPerMinute, requestsPerMonth: source?.requestLimit ?? 10_000 },
      freshnessSeconds: freshness?.expectedMaxAgeSeconds ?? 300,
      enabled: true,
      mode: 'live',
    };
  });
}

type History = readonly {
  version: number;
  savedAt: string;
  reason: string;
  snapshot: ProviderConfigInput;
}[];

const initial = (snapshot: ProviderConfigInput): History[number] => ({
  version: 1,
  savedAt: '2024-01-02T00:00:00.000Z',
  reason: 'Initial configuration.',
  snapshot,
});

export function seedProviderHistory(current: ProviderConfigInput): History {
  if (current.providerId === 'prov-primary') {
    return [
      {
        version: 2,
        savedAt: '2025-04-01T00:00:00.000Z',
        reason: 'Added intraday bars; the plan moved from 250,000 to 500,000 requests a month.',
        snapshot: current,
      },
      initial({
        ...current,
        coverage: {
          ...current.coverage,
          dataKinds: ['prices', 'corporate_actions', 'fundamentals'],
        },
        granularities: ['1d'],
        rateLimits: { ...current.rateLimits, requestsPerMonth: 250_000 },
        cost: { ...current.cost, monthlyBudget: '200.00' },
      }),
    ];
  }
  if (current.providerId === 'prov-news') {
    return [
      {
        version: 2,
        savedAt: '2025-09-10T00:00:00.000Z',
        reason: 'The wire publishes in batches, so late meant 5 minutes too often; now 15.',
        snapshot: current,
      },
      initial({ ...current, freshnessSeconds: 300 }),
    ];
  }
  return [initial(current)];
}

interface Finding {
  readonly status: ConfigHealthDto['status'];
  readonly summary: string;
}

const RANK: Readonly<Record<ConfigHealthDto['status'], number>> = {
  critical: 2,
  warning: 1,
  healthy: 0,
};

const percentUsed = (fraction: number): string => `${String(Math.round(fraction * 100))}%`;

function usageFinding(fraction: number, what: string): Finding | null {
  if (fraction >= CRITICAL_AT)
    return { status: 'critical', summary: `${percentUsed(fraction)} ${what}` };
  if (fraction >= WARN_AT)
    return { status: 'warning', summary: `${percentUsed(fraction)} ${what}` };
  return null;
}

export const describeAge = (seconds: number): string =>
  seconds < 120 ? `${String(seconds)} s` : `${String(Math.round(seconds / 60))} min`;

// Worst finding first. Usage and spend are this month's, measured against the configured limits,
// so raising a limit here changes the health it reports.
export function providerConfigHealth(
  config: ProviderConfigInput,
  all: readonly ProviderConfigInput[],
  scenario: string,
): ConfigHealthDto {
  const findings: Finding[] = [];
  const fault = FAULTS[scenario]?.[config.providerId];
  if (fault !== undefined) {
    findings.push({
      status: fault.status === 'down' ? 'critical' : 'warning',
      summary: fault.issue,
    });
  }

  const source = RELIABILITY_SOURCES.find((item) => item.id === config.providerId);
  const freshness = FRESHNESS.find((item) => item.id === config.providerId);
  if (source === undefined || freshness === undefined) {
    findings.push({
      status: 'warning',
      summary: 'Not checked yet: no requests or data recorded. Test the connection.',
    });
  } else {
    const age = FRESHNESS_DELAYS[scenario]?.[config.providerId] ?? freshness.ageSeconds;
    if (age > config.freshnessSeconds) {
      findings.push({
        status: 'critical',
        summary: `Newest data is ${describeAge(age)} old; expected within ${describeAge(config.freshnessSeconds)}.`,
      });
    }
    const used = Math.round(source.requestLimit * source.usage);
    const requests = usageFinding(
      used / config.rateLimits.requestsPerMonth,
      'of the monthly request limit used.',
    );
    if (requests !== null) findings.push(requests);
    // Usage is billed in USD; a budget in another currency cannot be compared without a rate.
    if (config.cost.currency === 'USD') {
      const spent = new Decimal(source.budget).times(source.spend);
      const budget = new Decimal(config.cost.monthlyBudget);
      const spend = budget.isZero()
        ? { status: 'critical' as const, summary: 'No budget, but this month has costs.' }
        : usageFinding(spent.dividedBy(budget).toNumber(), 'of the monthly budget spent.');
      if (spend !== null) findings.push(spend);
    } else {
      findings.push({
        status: 'warning',
        summary: `Spend is billed in USD, so it was not checked against a ${config.cost.currency} budget.`,
      });
    }
  }

  const clash = all.find(
    (other) =>
      other.providerId !== config.providerId &&
      // Only live, enabled providers are asked for data, so only they can compete for a place.
      other.enabled &&
      config.enabled &&
      other.mode === 'live' &&
      config.mode === 'live' &&
      other.priority === config.priority &&
      other.coverage.dataKinds.some((kind) => config.coverage.dataKinds.includes(kind)) &&
      other.coverage.markets.some((market) => config.coverage.markets.includes(market)),
  );
  if (clash !== undefined) {
    findings.push({
      status: 'warning',
      summary: `Shares priority ${String(config.priority)} with ${clash.name} for the same data, so which is asked first is undefined.`,
    });
  }

  const worst = [...findings].sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  if (worst !== undefined) {
    return findings.length > 1
      ? { status: worst.status, summary: `${worst.summary} (+${String(findings.length - 1)} more)` }
      : worst;
  }
  // Only reached with usage and freshness on record; a provider without them has a finding above.
  const used =
    source === undefined
      ? 0
      : source.usage * (source.requestLimit / config.rateLimits.requestsPerMonth);
  const age = FRESHNESS_DELAYS[scenario]?.[config.providerId] ?? freshness?.ageSeconds ?? 0;
  return {
    status: 'healthy',
    summary: `${percentUsed(used)} of monthly requests used; newest data ${describeAge(age)} old (late after ${describeAge(config.freshnessSeconds)}).`,
  };
}
