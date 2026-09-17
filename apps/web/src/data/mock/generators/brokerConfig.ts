// Broker configuration seeds and health (UI spec 7.18). Markets, account currency and automation
// support come from the canonical brokers; fees are the rules order history charges with; faults and
// API usage are System Health's, so a broker reads the same on every screen.

import type { BrokerConfigInput, ConfigHealthDto } from '../../schemas';
import { CANONICAL_BROKERS } from './brokers';
import { getInstrumentById } from './canonicalInstruments';
import { RELIABILITY_SOURCES } from './healthHistoryData';
import { FAULTS } from './healthMonitorData';
import { HOLDING_PROFILES } from './holdingProfiles';

const WARN_AT = 0.8;
const CRITICAL_AT = 0.95;

type Seed = Omit<
  BrokerConfigInput,
  'brokerId' | 'name' | 'country' | 'accountCurrency' | 'markets' | 'enabled' | 'mode'
>;

const MANUAL: Pick<
  Seed,
  'connection' | 'orderTypes' | 'capabilities' | 'credentialRef' | 'automationTypes'
> = {
  connection: 'manual',
  orderTypes: [],
  capabilities: {
    placesOrders: false,
    streamsPositions: false,
    fractionalQuantities: false,
    shortSelling: false,
    paperAccount: false,
  },
  credentialRef: null,
  automationTypes: [],
};

const SEEDS: Readonly<Record<string, Seed>> = {
  'brk-ibkr': {
    connection: 'api',
    instrumentTypes: [
      'long_term',
      'swing',
      'intraday',
      'etf',
      'bond',
      'commodity',
      'currency_pair',
      'derivative',
      'digital_asset',
    ],
    orderTypes: ['market', 'limit', 'stop', 'stop_limit'],
    capabilities: {
      placesOrders: true,
      streamsPositions: true,
      fractionalQuantities: true,
      shortSelling: true,
      paperAccount: true,
    },
    fees: { model: 'percentage', commissionBps: 5, minimumPerOrder: '1.00', flatPerOrder: '0.00' },
    credentialRef: 'vault://brokers/interactive-brokers',
    automationTypes: ['long_term', 'swing', 'etf'],
  },
  'brk-zerodha': {
    connection: 'api',
    instrumentTypes: ['long_term', 'swing', 'intraday', 'etf', 'mutual_fund', 'ipo', 'derivative'],
    orderTypes: ['market', 'limit', 'stop', 'stop_limit'],
    capabilities: {
      placesOrders: true,
      streamsPositions: true,
      fractionalQuantities: false,
      shortSelling: false,
      paperAccount: false,
    },
    fees: { model: 'flat', commissionBps: 0, minimumPerOrder: '0.00', flatPerOrder: '20.00' },
    credentialRef: 'vault://brokers/zerodha',
    automationTypes: ['long_term', 'swing', 'etf'],
  },
  'brk-hl': {
    ...MANUAL,
    instrumentTypes: ['long_term', 'etf', 'mutual_fund', 'bond'],
    fees: { model: 'flat', commissionBps: 0, minimumPerOrder: '0.00', flatPerOrder: '11.95' },
  },
  'brk-private-notes': {
    ...MANUAL,
    instrumentTypes: ['unlisted'],
    fees: { model: 'none', commissionBps: 0, minimumPerOrder: '0.00', flatPerOrder: '0.00' },
  },
};

// References the mock credential store holds. Values are never stored or shown anywhere.
export const KNOWN_BROKER_REFERENCES: ReadonlySet<string | null> = new Set(
  Object.values(SEEDS).map((seed) => seed.credentialRef),
);

export function seedBrokerConfigs(): readonly BrokerConfigInput[] {
  return CANONICAL_BROKERS.flatMap((broker) => {
    const seed = SEEDS[String(broker.id)];
    if (seed === undefined) return [];
    return [
      {
        brokerId: String(broker.id),
        name: broker.name,
        country: broker.country,
        accountCurrency: broker.accountCurrency,
        markets: broker.marketIds.map(String),
        ...structuredClone(seed),
        enabled: true,
        mode: 'live' as const,
      },
    ];
  });
}

type History = readonly {
  version: number;
  savedAt: string;
  reason: string;
  snapshot: BrokerConfigInput;
}[];

const initial = (snapshot: BrokerConfigInput): History[number] => ({
  version: 1,
  savedAt: '2024-01-02T00:00:00.000Z',
  reason: 'Initial configuration.',
  snapshot,
});

export function seedBrokerHistory(current: BrokerConfigInput): History {
  if (current.brokerId === 'brk-ibkr') {
    return [
      {
        version: 2,
        savedAt: '2025-02-10T00:00:00.000Z',
        reason: 'Market access for Japan and Singapore was added to the account.',
        snapshot: current,
      },
      initial({ ...current, markets: current.markets.filter((m) => m === 'US' || m === 'UK') }),
    ];
  }
  if (current.brokerId === 'brk-zerodha') {
    return [
      {
        version: 2,
        savedAt: '2025-06-02T00:00:00.000Z',
        reason:
          'Automation allowed for long-term, swing and ETF trades after three months of approvals.',
        snapshot: current,
      },
      initial({ ...current, automationTypes: [] }),
    ];
  }
  return [initial(current)];
}

export interface BrokerHolding {
  readonly symbol: string;
  readonly marketId: string;
  readonly type: BrokerConfigInput['instrumentTypes'][number];
}

// Positions the portfolio records at this broker.
export function holdingsAt(brokerId: string): readonly BrokerHolding[] {
  return Object.entries(HOLDING_PROFILES).flatMap(([instrumentId, profile]) => {
    const instrument = profile.brokerId === brokerId ? getInstrumentById(instrumentId) : undefined;
    return instrument === undefined
      ? []
      : [
          {
            symbol: instrument.symbol,
            marketId: String(instrument.marketId),
            type: instrument.type,
          },
        ];
  });
}

const RANK: Readonly<Record<ConfigHealthDto['status'], number>> = {
  critical: 2,
  warning: 1,
  healthy: 0,
};

export function brokerConfigHealth(config: BrokerConfigInput, scenario: string): ConfigHealthDto {
  const findings: ConfigHealthDto[] = [];
  const holdings = holdingsAt(config.brokerId);

  const fault = FAULTS[scenario]?.[config.brokerId];
  if (fault !== undefined && config.connection === 'api') {
    findings.push({
      status: fault.status === 'down' ? 'critical' : 'warning',
      summary: fault.issue,
    });
  }

  const outside = holdings.filter(
    (holding) =>
      !config.markets.includes(holding.marketId) || !config.instrumentTypes.includes(holding.type),
  );
  if (outside.length > 0) {
    findings.push({
      status: 'warning',
      summary: `Holds ${outside.map((holding) => holding.symbol).join(', ')} outside the markets or instrument types set here.`,
    });
  }
  if (!config.enabled && holdings.length > 0) {
    findings.push({
      status: 'warning',
      summary: `Disabled while it holds ${String(holdings.length)} position${holdings.length === 1 ? '' : 's'}; they are no longer reconciled.`,
    });
  }

  const source = RELIABILITY_SOURCES.find((item) => item.id === config.brokerId);
  if (config.connection === 'api' && source === undefined) {
    findings.push({
      status: 'warning',
      summary: 'Not connected yet: no session or requests recorded. Test the connection.',
    });
  }
  if (config.connection === 'api' && source !== undefined && source.usage >= WARN_AT) {
    findings.push({
      status: source.usage >= CRITICAL_AT ? 'critical' : 'warning',
      summary: `${String(Math.round(source.usage * 100))}% of the monthly API request limit used.`,
    });
  }

  const worst = [...findings].sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  if (worst !== undefined) {
    return findings.length > 1
      ? { status: worst.status, summary: `${worst.summary} (+${String(findings.length - 1)} more)` }
      : worst;
  }
  const count = `${String(holdings.length)} holding${holdings.length === 1 ? '' : 's'}`;
  return {
    status: 'healthy',
    summary:
      config.connection === 'manual'
        ? `Tracked from imported statements; ${count}.`
        : `Connected; ${count}${source === undefined ? '' : `, ${String(Math.round(source.usage * 100))}% of monthly API requests used`}.`,
  };
}
