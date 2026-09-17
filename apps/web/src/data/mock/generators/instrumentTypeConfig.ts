// Instrument type configuration seeds and health (UI spec 7.18). Markets come from each market's
// permitted instrument types and automation from the brokers' automation switches, so the three
// configuration areas start out agreeing.

import type {
  BrokerConfigInput,
  ConfigHealthDto,
  InstrumentTypeConfigInput,
  MarketConfigInput,
} from '../../schemas';
import { InstrumentTypeSchema } from '../../schemas';
import { getInstrumentById } from './canonicalInstruments';
import { HOLDING_PROFILES } from './holdingProfiles';

type InstrumentType = InstrumentTypeConfigInput['type'];

interface TypeSeed {
  readonly granularities: InstrumentTypeConfigInput['granularities'];
  readonly minimumQuantity: string;
  readonly minimumOrderValue: string;
  readonly settlementDays: number | null;
}

const DAILY: TypeSeed = {
  granularities: ['1d'],
  minimumQuantity: '1',
  minimumOrderValue: '0.00',
  settlementDays: null,
};

// Settlement is null where it follows the market (listed equities and funds on an exchange).
// Spot FX settles T+2 and crypto on the spot; tax thresholds follow the market for every type.
const SEEDS: Readonly<Record<InstrumentType, TypeSeed>> = {
  intraday: { ...DAILY, granularities: ['1m', '5m', '15m', '1h'] },
  swing: { ...DAILY, granularities: ['1h', '1d'] },
  long_term: DAILY,
  mutual_fund: {
    ...DAILY,
    minimumQuantity: '0.001',
    minimumOrderValue: '100.00',
    settlementDays: 1,
  },
  etf: DAILY,
  ipo: DAILY,
  bond: DAILY,
  commodity: { ...DAILY, granularities: ['1h', '1d'], minimumQuantity: '0.01' },
  currency_pair: {
    ...DAILY,
    granularities: ['1m', '1h', '1d'],
    minimumQuantity: '1000',
    settlementDays: 2,
  },
  derivative: { ...DAILY, granularities: ['5m', '1h', '1d'], settlementDays: 1 },
  digital_asset: {
    ...DAILY,
    granularities: ['1m', '1h', '1d'],
    minimumQuantity: '0.0001',
    settlementDays: 0,
  },
};

export function seedInstrumentTypeConfigs(
  markets: readonly MarketConfigInput[],
  brokers: readonly BrokerConfigInput[],
): readonly InstrumentTypeConfigInput[] {
  return InstrumentTypeSchema.options.map((type) => {
    const seed = SEEDS[type];
    const covered = markets.filter((market) => market.permittedInstrumentTypes.includes(type));
    return {
      type,
      enabled: covered.length > 0,
      automationPermitted: brokers.some((broker) => broker.automationTypes.includes(type)),
      // No manual-only type exists in the mock data yet (M-16), so none is seeded as one.
      manualOnly: false,
      markets: covered.map((market) => market.marketId),
      granularities: [...seed.granularities],
      minimumQuantity: seed.minimumQuantity,
      minimumOrderValue: seed.minimumOrderValue,
      settlementDays: seed.settlementDays,
    };
  });
}

type History = readonly {
  version: number;
  savedAt: string;
  reason: string;
  snapshot: InstrumentTypeConfigInput;
}[];

export function seedInstrumentTypeHistory(current: InstrumentTypeConfigInput): History {
  const initial = {
    version: 1,
    savedAt: '2024-01-02T00:00:00.000Z',
    reason: 'Initial configuration.',
  };
  // Invented mock history so diff and revert have something to show.
  if (current.type === 'mutual_fund') {
    return [
      {
        version: 2,
        savedAt: '2025-08-01T00:00:00.000Z',
        reason: 'Fund platforms allow fractional units, so the minimum moved from 1 unit to 0.001.',
        snapshot: current,
      },
      { ...initial, snapshot: { ...current, minimumQuantity: '1' } },
    ];
  }
  return [{ ...initial, snapshot: current }];
}

export function heldSymbols(
  predicate: (instrument: { type: string; currency: string }) => boolean,
): readonly string[] {
  return Object.keys(HOLDING_PROFILES).flatMap((instrumentId) => {
    const instrument = getInstrumentById(instrumentId);
    return instrument !== undefined && predicate(instrument) ? [instrument.symbol] : [];
  });
}

const RANK: Readonly<Record<ConfigHealthDto['status'], number>> = {
  critical: 2,
  warning: 1,
  healthy: 0,
};

export function instrumentTypeConfigHealth(
  config: InstrumentTypeConfigInput,
  markets: readonly MarketConfigInput[],
  brokers: readonly BrokerConfigInput[],
): ConfigHealthDto {
  const findings: ConfigHealthDto[] = [];
  const held = heldSymbols((instrument) => instrument.type === config.type);

  if (!config.enabled) {
    if (held.length > 0) {
      findings.push({
        status: 'warning',
        summary: `Disabled while ${held.join(', ')} ${held.length === 1 ? 'is' : 'are'} held.`,
      });
    }
  } else {
    const blocked = config.markets.filter((id) => {
      const market = markets.find((item) => item.marketId === id);
      return market === undefined || !market.permittedInstrumentTypes.includes(config.type);
    });
    if (blocked.length > 0) {
      findings.push({
        status: 'warning',
        summary: `${blocked.join(', ')} ${blocked.length === 1 ? 'does' : 'do'} not permit this type in its market configuration.`,
      });
    }
    if (
      config.automationPermitted &&
      !brokers.some((broker) => broker.enabled && broker.automationTypes.includes(config.type))
    ) {
      findings.push({
        status: 'warning',
        summary: 'Automation is permitted, but no enabled broker allows it for this type.',
      });
    }
  }

  const worst = [...findings].sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  if (worst !== undefined) {
    return findings.length > 1
      ? { status: worst.status, summary: `${worst.summary} (+${String(findings.length - 1)} more)` }
      : worst;
  }
  if (!config.enabled)
    return { status: 'healthy', summary: 'Disabled; nothing of this type is held.' };
  return {
    status: 'healthy',
    summary: `${String(config.markets.length)} market${config.markets.length === 1 ? '' : 's'}; ${String(held.length)} held${config.automationPermitted ? '; automation permitted' : ''}.`,
  };
}
