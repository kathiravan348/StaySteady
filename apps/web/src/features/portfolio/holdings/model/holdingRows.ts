// Holdings rows in the selected base currency (UI spec 7.2). Pure: no React, no fetching.
// Cost converts at each purchase date's FX rate, so unrealised gain splits into price movement and
// a separate currency effect: quantity x price x (rate now - rate at purchase).

import { Decimal } from 'decimal.js';

import { fxTableFromDtos, moneyFromDto } from '../../../../data/api/mappers';
import type {
  BrokerDto,
  FxRateDto,
  FxRateHistoryDto,
  HoldingDto,
  InstrumentDto,
  MarketDto,
  MarketQuoteDto,
  MoneyDto,
  NewsItemDto,
  StrategyDto,
} from '../../../../data/schemas';
import { directionOfNumber, humanizeToken } from '../../../../shared/format';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { FxQuote, Money } from '../../../../shared/money';
import { createMoney, findFxRate } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { FxHistoryIndex } from './fxOnDate';
import { fxTableOn, indexFxHistories } from './fxOnDate';
import { holdingTaxStatus, lotTaxStatus } from './holdingTax';
import type { ExitInfo, HoldingRow, LotView } from './holdingTypes';

export interface HoldingRowInputs {
  readonly holdings: readonly HoldingDto[];
  readonly quotes: readonly MarketQuoteDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly brokers: readonly BrokerDto[];
  readonly strategies: readonly StrategyDto[];
  readonly fxRates: readonly FxRateDto[];
  readonly fxHistories: readonly FxRateHistoryDto[];
  readonly news: readonly NewsItemDto[];
  readonly marketStates: ReadonlyMap<string, MarketSessionState>;
  readonly baseCurrency: BaseCurrencyCode;
  // Today's calendar date (YYYY-MM-DD), passed in to keep this function pure.
  readonly today: string;
}

interface FxContext {
  readonly current: readonly FxQuote[];
  readonly history: FxHistoryIndex;
}

type RowDraft = Omit<HoldingRow, 'weightPercent' | 'sizeRatio'>;

const DAY_MS = 86_400_000;
// Price within this percentage of the exit level is "near"; within the second is "watch".
const NEAR_EXIT_PERCENT = 3;
const WATCH_EXIT_PERCENT = 10;

function daysBetween(from: string, to: string): number {
  const elapsed = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.max(0, Math.floor(elapsed / DAY_MS));
}

function percentOf(part: Decimal, whole: Decimal): number {
  return whole.isZero() ? 0 : part.dividedBy(whole).times(100).toDecimalPlaces(2).toNumber();
}

function exitInfo(exitLevel: MoneyDto | undefined, lastPrice: Money): ExitInfo | null {
  if (exitLevel === undefined) {
    return null;
  }
  const level = moneyFromDto(exitLevel);
  const distancePercent = percentOf(lastPrice.amount.minus(level.amount), lastPrice.amount);
  const proximity =
    distancePercent <= NEAR_EXIT_PERCENT
      ? 'near'
      : distancePercent <= WATCH_EXIT_PERCENT
        ? 'watch'
        : 'clear';
  return { level, distancePercent, proximity };
}

function buildDraft(holding: HoldingDto, inputs: HoldingRowInputs, fx: FxContext): RowDraft | null {
  const instrument = inputs.instruments.find((item) => item.id === holding.instrumentId);
  if (instrument === undefined) {
    return null;
  }
  const market = inputs.markets.find((item) => item.marketId === instrument.marketId);
  const quote = inputs.quotes.find((item) => item.instrumentId === holding.instrumentId);
  const lastPrice = moneyFromDto(quote?.lastPrice ?? holding.currentPrice);
  const { currency } = lastPrice;
  const base = (amount: Decimal): Money<BaseCurrencyCode> =>
    createMoney(amount.toDecimalPlaces(2), inputs.baseCurrency);

  const rateNow = findFxRate(fx.current, currency, inputs.baseCurrency);
  if (rateNow === undefined) {
    throw new RangeError(`No FX rate path from ${currency} to ${inputs.baseCurrency}`);
  }

  const threshold = market?.holdingPeriodTaxThresholdDays ?? null;
  let costBase = new Decimal(0);
  let currencyEffect = new Decimal(0);
  const lots: LotView[] = holding.lots.map((lot) => {
    const quantity = new Decimal(lot.quantity);
    const rateThen =
      findFxRate(fxTableOn(fx.history, lot.purchaseDate), currency, inputs.baseCurrency) ?? rateNow;
    costBase = costBase.plus(quantity.times(lot.costPerUnit.amount).times(rateThen));
    currencyEffect = currencyEffect.plus(
      quantity.times(lastPrice.amount).times(rateNow.minus(rateThen)),
    );
    const daysHeld = daysBetween(lot.purchaseDate, inputs.today);
    return {
      id: lot.id,
      purchaseDate: lot.purchaseDate,
      quantity: lot.quantity,
      costPerUnit: moneyFromDto(lot.costPerUnit),
      daysHeld,
      tax: lotTaxStatus(daysHeld, threshold),
    };
  });

  const quantity = new Decimal(holding.quantity);
  const valueLocal = quantity.times(lastPrice.amount);
  const valueBase = valueLocal.times(rateNow);
  const gainBase = valueBase.minus(costBase);
  const localCost = new Decimal(holding.costBasis.amount);
  const news = inputs.news.filter((item) => item.relatedInstruments.includes(instrument.id));
  const strategy = inputs.strategies.find((item) => item.id === holding.openedByStrategyId);

  return {
    id: holding.id,
    instrument,
    marketName: market?.name ?? instrument.marketId,
    country: market?.country ?? instrument.marketId,
    marketState: inputs.marketStates.get(instrument.marketId) ?? null,
    typeLabel: humanizeToken(instrument.type),
    brokerName:
      inputs.brokers.find((item) => item.id === holding.brokerId)?.name ?? holding.brokerId,
    strategyName:
      holding.openedByStrategyId === undefined
        ? 'Manual'
        : (strategy?.name ?? holding.openedByStrategyId),
    quantity: holding.quantity,
    averageCost: createMoney(quantity.isZero() ? 0 : localCost.dividedBy(quantity), currency),
    lastPrice,
    changePercent: quote?.changePercent ?? 0,
    direction: directionOfNumber(quote?.changePercent ?? 0),
    valueLocal: createMoney(valueLocal, currency),
    valueBase: base(valueBase),
    costBase: base(costBase),
    gainBase: base(gainBase),
    gainPercent: percentOf(gainBase, costBase),
    currencyEffectBase: base(currencyEffect),
    daysHeld: lots.reduce((oldest, lot) => Math.max(oldest, lot.daysHeld), 0),
    tax: holdingTaxStatus(lots.map((lot) => lot.tax)),
    exit: exitInfo(holding.exitLevel, lastPrice),
    newsStories: new Set(news.map((item) => item.duplicateGroupId ?? item.id)).size,
    hasHighImportanceNews: news.some((item) => item.importance === 'high'),
    lots,
    quoteTimestamp: quote?.timestamp ?? null,
  };
}

export function buildHoldingRows(inputs: HoldingRowInputs): readonly HoldingRow[] {
  const fx: FxContext = {
    current: fxTableFromDtos(inputs.fxRates),
    history: indexFxHistories(inputs.fxHistories),
  };
  const drafts = inputs.holdings
    .map((holding) => buildDraft(holding, inputs, fx))
    .filter((draft): draft is RowDraft => draft !== null);
  const total = drafts.reduce((sum, draft) => sum.plus(draft.valueBase.amount), new Decimal(0));
  const largest = drafts.reduce(
    (max, draft) => Decimal.max(max, draft.valueBase.amount),
    new Decimal(0),
  );

  return drafts.map((draft) => ({
    ...draft,
    weightPercent: percentOf(draft.valueBase.amount, total),
    sizeRatio: largest.isZero() ? 0 : draft.valueBase.amount.dividedBy(largest).toNumber(),
  }));
}

// Same fields the table search covers, for exporting the current view.
export function matchesHoldingSearch(row: HoldingRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  return [
    row.instrument.symbol,
    row.instrument.name,
    row.marketName,
    row.typeLabel,
    row.brokerName,
    row.strategyName,
  ].some((value) => value.toLowerCase().includes(needle));
}
