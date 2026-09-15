// Overview figures in the selected base currency (UI spec 7.1). Pure: no React, no fetching.
// Positions are valued at live quotes; every amount converts through the FX table.

import { Decimal } from 'decimal.js';

import { fxTableFromDtos, moneyFromDto } from '../../../data/api/mappers';
import type {
  FxRateDto,
  HoldingDto,
  InstrumentDto,
  MarketDto,
  MarketQuoteDto,
  PortfolioSummaryDto,
} from '../../../data/schemas';
import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import type { BaseCurrencyCode } from '../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import { buildAllocation } from './overviewLists';
import type {
  BaseMoney,
  HeadlineFigures,
  PortfolioOverview,
  ValuedPosition,
} from './overviewTypes';

export interface OverviewInputs {
  readonly holdings: readonly HoldingDto[];
  readonly quotes: readonly MarketQuoteDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly fxRates: readonly FxRateDto[];
  readonly summary: PortfolioSummaryDto;
  readonly baseCurrency: BaseCurrencyCode;
}

interface PositionTotals {
  readonly position: ValuedPosition;
  readonly baseCost: Decimal;
  readonly baseToday: Decimal;
}

function percentOf(part: Decimal, whole: Decimal): number {
  return whole.isZero() ? 0 : part.dividedBy(whole).times(100).toDecimalPlaces(2).toNumber();
}

function valuePosition(
  holding: HoldingDto,
  inputs: OverviewInputs,
  table: readonly FxQuote[],
): PositionTotals | null {
  const instrument = inputs.instruments.find((item) => item.id === holding.instrumentId);
  if (instrument === undefined) {
    return null;
  }
  const quote = inputs.quotes.find((item) => item.instrumentId === holding.instrumentId);
  const quantity = new Decimal(holding.quantity);
  const lastPrice = moneyFromDto(quote?.lastPrice ?? holding.currentPrice);
  const toBase = (amount: Decimal, dto = lastPrice): BaseMoney =>
    convertMoneyWithTable(createMoney(amount, dto.currency), inputs.baseCurrency, table);
  // quote.change is signed against the previous close (decision 20).
  const todayLocal = quote === undefined ? new Decimal(0) : quantity.times(quote.change.amount);

  return {
    position: {
      instrument,
      lastPrice,
      changePercent: quote?.changePercent ?? 0,
      direction: quote?.direction ?? 'neutral',
      baseValue: toBase(quantity.times(lastPrice.amount)),
      quoteTimestamp: quote?.timestamp ?? null,
    },
    baseCost: toBase(new Decimal(holding.costBasis.amount), moneyFromDto(holding.costBasis)).amount,
    baseToday: toBase(todayLocal).amount,
  };
}

function oldestTimestamp(positions: readonly ValuedPosition[]): IsoUtcTimestamp | null {
  let oldest: IsoUtcTimestamp | null = null;
  for (const position of positions) {
    const stamp = position.quoteTimestamp;
    if (stamp !== null && (oldest === null || stamp < oldest)) {
      oldest = stamp;
    }
  }
  return oldest;
}

export function buildPortfolioOverview(inputs: OverviewInputs): PortfolioOverview {
  const table = fxTableFromDtos(inputs.fxRates);
  const valued = inputs.holdings
    .map((holding) => valuePosition(holding, inputs, table))
    .filter((item): item is PositionTotals => item !== null);
  const sum = (pick: (item: PositionTotals) => Decimal): Decimal =>
    valued.reduce((total, item) => total.plus(pick(item)), new Decimal(0));

  const total = sum((item) => item.position.baseValue.amount);
  const cost = sum((item) => item.baseCost);
  const today = sum((item) => item.baseToday);
  const cash = convertMoneyWithTable(
    moneyFromDto(inputs.summary.cashBalance),
    inputs.baseCurrency,
    table,
  );
  const base = (amount: Decimal): BaseMoney => createMoney(amount, inputs.baseCurrency);
  const positions = valued.map((item) => item.position);

  const headline: HeadlineFigures = {
    totalValue: base(total),
    costBasis: base(cost),
    unrealisedGain: base(total.minus(cost)),
    unrealisedGainPercent: percentOf(total.minus(cost), cost),
    todayChange: base(today),
    todayChangePercent: percentOf(today, total.minus(today)),
    cash,
    deployedPercent: percentOf(total, total.plus(cash.amount)),
    openPositions: positions.length,
  };

  return {
    headline,
    positions,
    allocation: buildAllocation({
      positions,
      markets: inputs.markets,
      total,
      baseCurrency: inputs.baseCurrency,
    }),
    oldestQuoteTimestamp: oldestTimestamp(positions),
  };
}
