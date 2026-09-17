// Positions opened by automation (nav map 6; open question 10, recommended option). Holdings lists
// everything owned; a position here is a holding a strategy opened, seen from the automation's side:
// what its strategy's stage means for the exit, how far the stop is, and what is still working.
// Pure: no React, no fetching.

import { Decimal } from 'decimal.js';

import { fxTableFromDtos, moneyFromDto } from '../../../../data/api';
import type {
  BrokerDto,
  FxRateDto,
  HoldingDto,
  InstrumentDto,
  MarketQuoteDto,
  OrderHistoryEntryDto,
  StrategyDto,
  StrategyStageDto,
} from '../../../../data/schemas';
import type { FxQuote, Money } from '../../../../shared/money';
import { createMoney, findFxRate } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';

// What happens when the price reaches the stop, decided by the strategy's stage.
export type ExitHandling = 'automatic' | 'approval' | 'none';
// Within the first percentage of the stop is "near"; within the second, "watch". Same bands as Holdings.
export type StopProximity = 'near' | 'watch' | 'clear' | 'no-stop';
const NEAR_STOP_PERCENT = 3;
const WATCH_STOP_PERCENT = 10;
const WORKING: ReadonlySet<OrderHistoryEntryDto['status']> = new Set([
  'pending',
  'partially_filled',
  'unconfirmed',
]);

export const EXIT_HANDLINGS: readonly ExitHandling[] = ['automatic', 'approval', 'none'];

export const EXIT_HANDLING_LABELS: Readonly<Record<ExitHandling, string>> = {
  automatic: 'Exits automatically',
  approval: 'Exit needs approval',
  none: 'No automated exit',
};

export interface PositionRow {
  readonly id: string;
  readonly instrument: InstrumentDto;
  readonly brokerName: string;
  readonly strategy: StrategyDto;
  readonly exitHandling: ExitHandling;
  readonly quantity: HoldingDto['quantity'];
  readonly averageCost: Money;
  readonly lastPrice: Money;
  readonly changePercent: number;
  readonly valueBase: Money<BaseCurrencyCode>;
  // Against cost in the instrument's currency; Holdings splits out the currency effect.
  readonly gainLocal: Money;
  readonly gainPercent: number;
  readonly openedOn: HoldingDto['lots'][number]['purchaseDate'] | null;
  readonly lotCount: number;
  readonly stop: Money | null;
  // Price above the stop as a share of the price; negative once the price is through the stop.
  readonly stopDistancePercent: number | null;
  readonly proximity: StopProximity;
  // Value lost from here if the price falls to the stop (zero or negative), in the base currency.
  readonly dropToStopBase: Money<BaseCurrencyCode> | null;
  // Gain or loss against cost if the position were closed at the stop, in the instrument's currency.
  readonly resultAtStop: Money | null;
  readonly rules: readonly string[];
  readonly workingOrders: readonly OrderHistoryEntryDto[];
  readonly quoteTimestamp: IsoUtcTimestamp | null;
}

export interface PositionRowInputs {
  readonly holdings: readonly HoldingDto[];
  readonly strategies: readonly StrategyDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly brokers: readonly BrokerDto[];
  readonly quotes: readonly MarketQuoteDto[];
  readonly fxRates: readonly FxRateDto[];
  readonly orders: readonly OrderHistoryEntryDto[];
  readonly baseCurrency: BaseCurrencyCode;
}

export function exitHandlingFor(stage: StrategyStageDto): ExitHandling {
  return stage === 'fully_automatic'
    ? 'automatic'
    : stage === 'semi_automatic'
      ? 'approval'
      : 'none';
}

// The strategy's exit and sizing rules, from the parameters that describe them.
export function strategyRules(strategy: StrategyDto): readonly string[] {
  const rules: string[] = [];
  const { atrStopMultiplier, profitTargetPct, maxRiskPerTradePct, holdDays } = strategy.parameters;
  if (typeof atrStopMultiplier === 'number') {
    rules.push(`Trailing stop ${String(atrStopMultiplier)} × ATR below the price`);
  }
  if (typeof profitTargetPct === 'number') {
    rules.push(`Takes profit at +${String(profitTargetPct)}% from entry`);
  }
  if (typeof holdDays === 'number') {
    rules.push(`Exits after ${String(holdDays)} days`);
  }
  if (typeof maxRiskPerTradePct === 'number') {
    rules.push(`Sized to risk ${String(maxRiskPerTradePct)}% of capital per trade`);
  }
  return rules;
}

function percentOf(part: Decimal, whole: Decimal): number {
  return whole.isZero() ? 0 : part.dividedBy(whole).times(100).toDecimalPlaces(2).toNumber();
}

function proximityOf(distance: number | null): StopProximity {
  if (distance === null) return 'no-stop';
  return distance <= NEAR_STOP_PERCENT
    ? 'near'
    : distance <= WATCH_STOP_PERCENT
      ? 'watch'
      : 'clear';
}

function buildRow(
  holding: HoldingDto,
  inputs: PositionRowInputs,
  table: readonly FxQuote[],
): PositionRow | null {
  const strategy = inputs.strategies.find((item) => item.id === holding.openedByStrategyId);
  const instrument = inputs.instruments.find((item) => item.id === holding.instrumentId);
  if (strategy === undefined || instrument === undefined) return null;

  const quote = inputs.quotes.find((item) => item.instrumentId === holding.instrumentId);
  const lastPrice = moneyFromDto(quote?.lastPrice ?? holding.currentPrice);
  const { currency } = lastPrice;
  const rate = findFxRate(table, currency, inputs.baseCurrency);
  if (rate === undefined) {
    throw new RangeError(`No FX rate path from ${currency} to ${inputs.baseCurrency}`);
  }
  const base = (amount: Decimal): Money<BaseCurrencyCode> =>
    createMoney(amount.times(rate).toDecimalPlaces(2), inputs.baseCurrency);

  const quantity = new Decimal(holding.quantity);
  const cost = new Decimal(holding.costBasis.amount);
  const value = quantity.times(lastPrice.amount);
  const stop = holding.exitLevel === undefined ? null : moneyFromDto(holding.exitLevel);
  const stopDistancePercent =
    stop === null ? null : percentOf(lastPrice.amount.minus(stop.amount), lastPrice.amount);
  const openedOn = holding.lots.map((lot) => lot.purchaseDate).sort()[0] ?? null;

  return {
    id: holding.id,
    instrument,
    brokerName:
      inputs.brokers.find((item) => item.id === holding.brokerId)?.name ?? holding.brokerId,
    strategy,
    exitHandling: exitHandlingFor(strategy.stage),
    quantity: holding.quantity,
    averageCost: createMoney(quantity.isZero() ? 0 : cost.dividedBy(quantity), currency),
    lastPrice,
    changePercent: quote?.changePercent ?? 0,
    valueBase: base(value),
    gainLocal: createMoney(value.minus(cost).toDecimalPlaces(2), currency),
    gainPercent: percentOf(value.minus(cost), cost),
    openedOn,
    lotCount: holding.lots.length,
    stop,
    stopDistancePercent,
    proximity: proximityOf(stopDistancePercent),
    dropToStopBase:
      stop === null
        ? null
        : base(Decimal.min(stop.amount.minus(lastPrice.amount), 0).times(quantity)),
    resultAtStop:
      stop === null
        ? null
        : createMoney(stop.amount.times(quantity).minus(cost).toDecimalPlaces(2), currency),
    rules: strategyRules(strategy),
    workingOrders: inputs.orders.filter(
      (order) => order.instrumentId === holding.instrumentId && WORKING.has(order.status),
    ),
    quoteTimestamp: quote?.timestamp ?? null,
  };
}

export function buildPositionRows(inputs: PositionRowInputs): readonly PositionRow[] {
  const table = fxTableFromDtos(inputs.fxRates);
  return inputs.holdings
    .filter((holding) => holding.openedByStrategyId !== undefined)
    .map((holding) => buildRow(holding, inputs, table))
    .filter((row): row is PositionRow => row !== null);
}

export function sumBase(
  values: readonly Money<BaseCurrencyCode>[],
  currency: BaseCurrencyCode,
): Money<BaseCurrencyCode> {
  return createMoney(
    values.reduce((sum, value) => sum.plus(value.amount), new Decimal(0)),
    currency,
  );
}

// Why a position needs the owner, or null. A position close to its stop whose strategy will not
// place the exit is the one to act on, as is one with an order nobody knows is live.
export function attentionReason(row: PositionRow): string | null {
  if (row.workingOrders.some((order) => order.status === 'unconfirmed')) {
    return 'an order was never confirmed by the broker, so placing another could open a duplicate';
  }
  if (row.proximity !== 'near' || row.exitHandling === 'automatic') return null;
  const where =
    row.stopDistancePercent !== null && row.stopDistancePercent < 0
      ? 'the price is through its stop'
      : `the price is within ${String(NEAR_STOP_PERCENT)}% of its stop`;
  return row.exitHandling === 'approval'
    ? `${where}, and the exit waits for your approval`
    : `${where}, and its strategy (${row.strategy.name}) will not exit it`;
}
