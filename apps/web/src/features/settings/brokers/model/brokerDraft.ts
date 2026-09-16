// Editing a broker configuration (UI spec 7.18): a blank new broker, labels, what a sample trade would
// cost, and a version described in the screen's own words for the diff.

import type {
  BrokerConfigInput,
  BrokerFeeModelDto,
  InstrumentTypeDto,
  OrderTypeDto,
} from '../../../../data/schemas';
import { InstrumentTypeSchema, OrderTypeSchema } from '../../../../data/schemas';
import { formatMoney, humanizeToken } from '../../../../shared/format';
import type { Money } from '../../../../shared/money';
import { compareMoney, createMoney, multiplyMoney } from '../../../../shared/money';

const ORDER_TYPE_LABELS: Readonly<Record<OrderTypeDto, string>> = {
  market: 'Market',
  limit: 'Limit',
  stop: 'Stop',
  stop_limit: 'Stop limit',
};

export const FEE_MODEL_OPTIONS: readonly { value: BrokerFeeModelDto; label: string }[] = [
  { value: 'percentage', label: 'Percentage with a minimum' },
  { value: 'flat', label: 'Flat per order' },
  { value: 'none', label: 'No commission' },
];

export const ORDER_TYPE_OPTIONS = OrderTypeSchema.options.map((value) => ({
  value,
  label: ORDER_TYPE_LABELS[value],
}));

// Acronyms keep their capitals; humanizeToken alone would print Etf and Ipo.
const ACRONYMS: Partial<Record<InstrumentTypeDto, string>> = { etf: 'ETF', ipo: 'IPO' };

export const instrumentTypeLabel = (type: InstrumentTypeDto): string =>
  ACRONYMS[type] ?? humanizeToken(type);

// For use mid-sentence: acronyms stay in capitals, other labels go lower case.
export const instrumentTypeInSentence = (type: InstrumentTypeDto): string =>
  ACRONYMS[type] ?? humanizeToken(type).toLowerCase();

export const INSTRUMENT_TYPE_OPTIONS = InstrumentTypeSchema.options.map((value) => ({
  value,
  label: instrumentTypeLabel(value),
}));

// A new broker is conservative: tracked manually, no orders, no automation, in simulation. Connecting
// it and allowing trading are deliberate steps.
export function blankBroker(): BrokerConfigInput {
  return {
    brokerId: 'brk-',
    name: '',
    country: '',
    accountCurrency: 'USD',
    connection: 'manual',
    markets: [],
    instrumentTypes: ['long_term'],
    orderTypes: [],
    capabilities: {
      placesOrders: false,
      streamsPositions: false,
      fractionalQuantities: false,
      shortSelling: false,
      paperAccount: false,
    },
    fees: { model: 'none', commissionBps: 0, minimumPerOrder: '0.00', flatPerOrder: '0.00' },
    credentialRef: null,
    automationTypes: [],
    enabled: true,
    mode: 'simulation',
  };
}

// Switching to manual clears everything a manual broker cannot do, so the form does not open with
// errors the owner did not cause. Switching to API only adds the reference placeholder.
export function withConnection(
  draft: BrokerConfigInput,
  connection: BrokerConfigInput['connection'],
): BrokerConfigInput {
  if (connection === 'api') {
    return { ...draft, connection, credentialRef: draft.credentialRef ?? 'vault://brokers/' };
  }
  return {
    ...draft,
    connection,
    credentialRef: null,
    orderTypes: [],
    automationTypes: [],
    capabilities: {
      ...draft.capabilities,
      placesOrders: false,
      streamsPositions: false,
      paperAccount: false,
    },
  };
}

const AMOUNT = /^\d+(\.\d{1,4})?$/;
export const SAMPLE_TRADE = '10000';

// What one trade of SAMPLE_TRADE in the account currency would cost in commission.
export function sampleFee(draft: BrokerConfigInput): Money | null {
  const { fees, accountCurrency } = draft;
  if (fees.model === 'none') return createMoney(0, accountCurrency);
  if (fees.model === 'flat') {
    return AMOUNT.test(fees.flatPerOrder) ? createMoney(fees.flatPerOrder, accountCurrency) : null;
  }
  if (!Number.isFinite(fees.commissionBps) || !AMOUNT.test(fees.minimumPerOrder)) return null;
  const rate = multiplyMoney(
    createMoney(SAMPLE_TRADE, accountCurrency),
    fees.commissionBps / 10_000,
  );
  const minimum = createMoney(fees.minimumPerOrder, accountCurrency);
  return compareMoney(rate, minimum) >= 0 ? rate : minimum;
}

const list = (values: readonly string[]): string => values.join(', ') || 'None';

// The same set in the same order, however it was saved, so a diff shows only real changes.
const inOptionOrder = (types: readonly InstrumentTypeDto[]): InstrumentTypeDto[] =>
  InstrumentTypeSchema.options.filter((type) => types.includes(type));

function describeFees(config: BrokerConfigInput): string {
  const { fees } = config;
  if (fees.model === 'none') return 'No commission';
  if (fees.model === 'flat') return `${fees.flatPerOrder} per order`;
  return `${String(fees.commissionBps)} bps, minimum ${fees.minimumPerOrder}`;
}

export function describeBroker(config: BrokerConfigInput): Record<string, string> {
  const can = config.capabilities;
  const yes = (value: boolean): string => (value ? 'Yes' : 'No');
  const fee = sampleFee(config);
  return {
    Name: config.name,
    Country: config.country,
    'Account currency': config.accountCurrency,
    Connection: config.connection === 'api' ? 'API' : 'Manual (imported statements)',
    Markets: list(config.markets),
    'Instrument types': list(inOptionOrder(config.instrumentTypes).map(instrumentTypeLabel)),
    'Order types': list(config.orderTypes.map((type) => ORDER_TYPE_LABELS[type])),
    'Places orders': yes(can.placesOrders),
    'Streams positions': yes(can.streamsPositions),
    'Fractional quantities': yes(can.fractionalQuantities),
    'Short selling': yes(can.shortSelling),
    'Paper account': yes(can.paperAccount),
    Fees:
      fee === null
        ? describeFees(config)
        : `${describeFees(config)} (${formatMoney(fee)} on 10,000)`,
    'Credential reference': config.credentialRef ?? 'None',
    'Automation allowed for': list(inOptionOrder(config.automationTypes).map(instrumentTypeLabel)),
    Enabled: yes(config.enabled),
    Mode: config.mode === 'live' ? 'Live' : 'Simulation',
  };
}
