// The layered automation permission (UI spec 7.18; requirements 233): an automated order proceeds only
// if the market, the instrument type, a broker and the strategy all permit it. Worked out from the
// saved configurations, so a change on any of those screens shows here at once. Pure: no React.

import type {
  BrokerConfigInput,
  InstrumentDto,
  InstrumentTypeConfigInput,
  MarketConfigInput,
  StrategyDto,
} from '../../../../data/schemas';
import { humanizeToken, instrumentTypeLabel } from '../../../../shared/format';

type InstrumentType = InstrumentTypeConfigInput['type'];

// "simulation" means every layer allows it, but at least one only in simulation mode.
export type LayerStatus = 'allows' | 'simulation' | 'blocks';
export type Outcome = 'live' | 'simulation' | 'blocked';

export interface Layer {
  readonly name: string;
  readonly status: LayerStatus;
  readonly detail: string;
}

export interface CellPermission {
  readonly marketId: string;
  readonly type: InstrumentType;
  readonly layers: readonly Layer[];
  readonly outcome: Outcome;
  // The first layer that blocks, for the grid; null unless blocked.
  readonly blockedBy: string | null;
  readonly brokerName: string | null;
}

export interface PermissionInputs {
  readonly markets: readonly MarketConfigInput[];
  readonly brokers: readonly BrokerConfigInput[];
  readonly types: readonly InstrumentTypeConfigInput[];
}

const allows = (name: string, detail: string): Layer => ({ name, status: 'allows', detail });
const blocks = (name: string, detail: string): Layer => ({ name, status: 'blocks', detail });

function marketLayer(market: MarketConfigInput | undefined, type: InstrumentType): Layer {
  const name = 'Market';
  if (market === undefined) return blocks(name, 'Not configured.');
  if (!market.enabled) return blocks(name, `${market.name} is switched off.`);
  if (!market.permittedInstrumentTypes.includes(type)) {
    return blocks(name, `${market.name} does not permit ${instrumentTypeLabel(type)}.`);
  }
  if (!market.automationPermitted) {
    return blocks(name, `${market.name} does not permit automation.`);
  }
  return market.mode === 'simulation'
    ? { name, status: 'simulation', detail: `${market.name} permits it, in simulation only.` }
    : allows(name, `${market.name} permits automated ${instrumentTypeLabel(type)} trades.`);
}

function typeLayer(config: InstrumentTypeConfigInput | undefined, marketId: string): Layer {
  const name = 'Instrument type';
  if (config === undefined) return blocks(name, 'Not configured.');
  const label = instrumentTypeLabel(config.type);
  if (!config.enabled) return blocks(name, `${label} is switched off.`);
  if (config.manualOnly) return blocks(name, `${label} is manual only.`);
  if (!config.automationPermitted) return blocks(name, `${label} does not permit automation.`);
  if (!config.markets.includes(marketId)) {
    return blocks(name, `${label} is not set up for ${marketId}.`);
  }
  return allows(name, `${label} permits automation in ${marketId}.`);
}

// Why one broker cannot carry an automated order of this type in this market, or null if it can.
function brokerBlock(broker: BrokerConfigInput, type: InstrumentType): string | null {
  if (broker.connection === 'manual') return `${broker.name} is tracked by hand and never trades.`;
  if (!broker.capabilities.placesOrders) return `${broker.name} cannot place orders.`;
  if (!broker.automationTypes.includes(type)) {
    return `${broker.name} does not allow automation for ${instrumentTypeLabel(type)}.`;
  }
  return null;
}

function brokerLayers(
  brokers: readonly BrokerConfigInput[],
  marketId: string,
  type: InstrumentType,
): { layers: Layer[]; carrier: BrokerConfigInput | null } {
  const candidates = brokers.filter(
    (broker) =>
      broker.enabled && broker.markets.includes(marketId) && broker.instrumentTypes.includes(type),
  );
  if (candidates.length === 0) {
    return {
      layers: [
        blocks('Broker', `No enabled broker carries ${instrumentTypeLabel(type)} in ${marketId}.`),
      ],
      carrier: null,
    };
  }
  const layers = candidates.map((broker): Layer => {
    const reason = brokerBlock(broker, type);
    if (reason !== null) return blocks(`Broker: ${broker.name}`, reason);
    return broker.mode === 'simulation'
      ? {
          name: `Broker: ${broker.name}`,
          status: 'simulation',
          detail: `${broker.name} may automate it, in simulation only.`,
        }
      : allows(`Broker: ${broker.name}`, `${broker.name} may place automated orders, live.`);
  });
  // A live carrier is preferred; any broker that allows it is enough for the broker layer.
  const carrier =
    candidates.find((broker) => brokerBlock(broker, type) === null && broker.mode === 'live') ??
    candidates.find((broker) => brokerBlock(broker, type) === null) ??
    null;
  return { layers, carrier };
}

export function evaluateCell(
  inputs: PermissionInputs,
  marketId: string,
  type: InstrumentType,
): CellPermission {
  const market = marketLayer(
    inputs.markets.find((item) => item.marketId === marketId),
    type,
  );
  const typeCheck = typeLayer(
    inputs.types.find((item) => item.type === type),
    marketId,
  );
  const { layers: brokers, carrier } = brokerLayers(inputs.brokers, marketId, type);
  // The broker layer as a whole blocks only if no single broker allows it.
  const brokerStatus: LayerStatus =
    carrier === null ? 'blocks' : carrier.mode === 'live' ? 'allows' : 'simulation';
  const statuses = [
    { name: 'Market', status: market.status },
    { name: 'Instrument type', status: typeCheck.status },
    { name: 'Broker', status: brokerStatus },
  ];
  const blocking = statuses.find((layer) => layer.status === 'blocks');
  const outcome: Outcome =
    blocking !== undefined
      ? 'blocked'
      : statuses.some((layer) => layer.status === 'simulation')
        ? 'simulation'
        : 'live';
  return {
    marketId,
    type,
    layers: [market, typeCheck, ...brokers],
    outcome,
    blockedBy: blocking?.name ?? null,
    brokerName: carrier?.name ?? null,
  };
}

export type StageEffect = 'without-approval' | 'with-approval' | 'no-orders';

export function stageEffect(stage: StrategyDto['stage']): StageEffect {
  return stage === 'fully_automatic'
    ? 'without-approval'
    : stage === 'semi_automatic'
      ? 'with-approval'
      : 'no-orders';
}

export interface StrategyInstrumentPermission {
  readonly instrumentId: string;
  readonly symbol: string;
  readonly cell: CellPermission | null;
  // What actually happens, in words.
  readonly result: string;
  readonly canTrade: boolean;
}

export function strategyPermissions(
  strategy: StrategyDto,
  instruments: readonly InstrumentDto[],
  inputs: PermissionInputs,
): readonly StrategyInstrumentPermission[] {
  const effect = stageEffect(strategy.stage);
  return strategy.universe.map((instrumentId) => {
    const instrument = instruments.find((item) => item.id === instrumentId);
    if (instrument === undefined) {
      return {
        instrumentId: String(instrumentId),
        symbol: String(instrumentId),
        cell: null,
        result: 'Unknown instrument, so nothing can be traded.',
        canTrade: false,
      };
    }
    const cell = evaluateCell(inputs, String(instrument.marketId), instrument.type);
    const symbol = instrument.symbol;
    const base = { instrumentId: String(instrumentId), symbol, cell };
    if (effect === 'no-orders') {
      return {
        ...base,
        result: `The strategy is ${humanizeToken(strategy.stage).toLowerCase()}, so it places no orders.`,
        canTrade: false,
      };
    }
    if (cell.outcome === 'blocked') {
      const reason = cell.layers.find((layer) => layer.status === 'blocks')?.detail ?? '';
      return { ...base, result: `Blocked: ${reason}`, canTrade: false };
    }
    const how = effect === 'without-approval' ? 'without asking' : 'after your approval';
    const where = cell.brokerName === null ? '' : ` through ${cell.brokerName}`;
    return {
      ...base,
      result:
        cell.outcome === 'simulation'
          ? `Trades in simulation only${where}, ${how}.`
          : `Trades live${where}, ${how}.`,
      canTrade: cell.outcome === 'live',
    };
  });
}
