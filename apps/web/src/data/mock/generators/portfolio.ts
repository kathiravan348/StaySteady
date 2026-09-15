// Holdings, purchase lots, transactions and portfolio summary (M-09, reworked session 19).
// One price source: lot costs are historical closes on the purchase date, current value uses the
// live quote, and every total converts to the base currency through FX rates.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { FxQuote } from '../../../shared/money';
import { convertMoneyWithTable, createMoney } from '../../../shared/money';
import type { CurrencyCode } from '../../../shared/types/currency';
import type {
  HoldingDto,
  InstrumentDto,
  MarketQuoteDto,
  PortfolioSummaryDto,
  TransactionDto,
} from '../../schemas';
import { HoldingSchema, PortfolioSummarySchema, TransactionSchema } from '../../schemas';
import { generateCurrentFxRates } from './fxHistory';
import { CANONICAL_INSTRUMENTS, generateInitialQuotes } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { generatePriceHistoryForInstrument } from './priceHistory';
import { parseGenerated, parseGeneratedList } from './validated';
import { currencyDecimals, directionOf, toUtcDate } from './values';

export interface PortfolioDataBundle {
  readonly holdings: readonly HoldingDto[];
  readonly transactions: readonly TransactionDto[];
  readonly summary: PortfolioSummaryDto;
}

type HoldingInput = z.input<typeof HoldingSchema>;
type LotInput = HoldingInput['lots'][number];
type TransactionInput = z.input<typeof TransactionSchema>;
type MoneyInput = HoldingInput['currentValue'];

const BASE_CURRENCY: CurrencyCode = 'USD';
const BUY_FEE = new Decimal('1.50');
const HELD_INSTRUMENT_IDS: readonly string[] = [
  'inst-us-aapl',
  'inst-us-spy',
  'inst-us-btc',
  'inst-us-gold',
  'inst-in-reliance',
  'inst-uk-azn',
  'inst-manual-bond',
];

const CASH_TRANSACTIONS: readonly TransactionInput[] = [
  {
    id: 'tx-div-01',
    instrumentId: 'inst-us-aapl',
    type: 'dividend',
    timestamp: '2025-02-15T18:00:00Z',
    fees: { amount: '0.00', currency: 'USD' },
    netAmount: { amount: '24.50', currency: 'USD' },
    notes: 'Quarterly dividend payment received',
  },
  {
    id: 'tx-dep-01',
    type: 'deposit',
    timestamp: '2022-01-05T10:00:00Z',
    fees: { amount: '0.00', currency: 'USD' },
    netAmount: { amount: '50000.00', currency: 'USD' },
    notes: 'Initial account funding from checking',
  },
];

function money(amount: Decimal, currency: CurrencyCode): MoneyInput {
  return { amount: amount.toFixed(currencyDecimals(currency)), currency };
}

interface HoldingRequest {
  readonly ctx: MockGeneratorContext;
  readonly instrument: InstrumentDto;
  readonly index: number;
  readonly quotes: readonly MarketQuoteDto[];
}

interface ValuedHolding {
  readonly holding: HoldingInput;
  readonly transactions: readonly TransactionInput[];
  readonly value: Decimal;
  readonly cost: Decimal;
}

// Purchase days are seeded positions in the instrument's own history, oldest first.
function valueHolding({ ctx, instrument, index, quotes }: HoldingRequest): ValuedHolding {
  const stream = ctx.random.fork(`holding:${instrument.id}`);
  const holdingId = `hld-${index + 1}`;
  const { currency } = instrument;
  const decimals = currencyDecimals(currency);
  const bars = generatePriceHistoryForInstrument(ctx, instrument);
  const lotCount = instrument.symbol === 'AAPL' || instrument.symbol === 'SPY' ? 3 : 1;
  const barIndexes = Array.from({ length: lotCount }, () =>
    stream.int(0, Math.max(0, bars.length - 25)),
  ).sort((a, b) => a - b);

  const lots: LotInput[] = [];
  const transactions: TransactionInput[] = [];
  let quantity = new Decimal(0);
  let cost = new Decimal(0);

  barIndexes.forEach((barIndex, lotIndex) => {
    const bar = bars[barIndex];
    if (bar === undefined) {
      return;
    }
    const lotQuantity =
      instrument.type === 'digital_asset'
        ? new Decimal(stream.float(0.05, 0.4)).toDecimalPlaces(4)
        : new Decimal(stream.int(10, 50));
    const unitCost = new Decimal(bar.close);
    const totalCost = lotQuantity.times(unitCost).toDecimalPlaces(decimals);
    const purchaseDate = toUtcDate(bar.timestamp);
    const lotNumber = lotIndex + 1;

    lots.push({
      id: `lot-${holdingId}-${lotNumber}`,
      holdingId,
      purchaseDate,
      quantity: lotQuantity.toNumber(),
      costPerUnit: money(unitCost, currency),
      totalCost: money(totalCost, currency),
    });
    transactions.push({
      id: `tx-${holdingId}-buy-${lotNumber}`,
      instrumentId: instrument.id,
      type: 'buy',
      timestamp: `${purchaseDate}T14:30:00Z`,
      quantity: lotQuantity.toNumber(),
      unitPrice: money(unitCost, currency),
      fees: money(BUY_FEE, currency),
      netAmount: money(totalCost.plus(BUY_FEE), currency),
      notes: `Executed lot ${lotNumber} allocation`,
    });
    quantity = quantity.plus(lotQuantity);
    cost = cost.plus(totalCost);
  });

  const quote = quotes.find((q) => q.instrumentId === instrument.id);
  const price = new Decimal(quote?.lastPrice.amount ?? bars[bars.length - 1]?.close ?? 0);
  const value = quantity.times(price).toDecimalPlaces(decimals);
  const gain = value.minus(cost);

  return {
    holding: {
      id: holdingId,
      instrumentId: instrument.id,
      quantity: quantity.toNumber(),
      costBasis: money(cost, currency),
      currentPrice: money(price, currency),
      currentValue: money(value, currency),
      unrealisedGainLoss: money(gain, currency),
      unrealisedGainLossPercent: cost.isZero()
        ? 0
        : gain.dividedBy(cost).times(100).toDecimalPlaces(2).toNumber(),
      direction: directionOf(gain),
      allocationPercent: 0,
      lots,
    },
    transactions,
    value,
    cost,
  };
}

function toBase(amount: Decimal, currency: CurrencyCode, fxTable: readonly FxQuote[]): Decimal {
  return convertMoneyWithTable(createMoney(amount, currency), BASE_CURRENCY, fxTable).amount;
}

function emptyPortfolio(ctx: MockGeneratorContext): PortfolioDataBundle {
  const zero = money(new Decimal(0), BASE_CURRENCY);
  const summary: z.input<typeof PortfolioSummarySchema> = {
    totalValue: zero,
    costBasis: zero,
    unrealisedReturn: zero,
    unrealisedReturnPercent: 0,
    direction: 'neutral',
    cashBalance: money(new Decimal('50000'), BASE_CURRENCY),
    activeHoldingsCount: 0,
    asOf: ctx.referenceTime,
  };
  return {
    holdings: [],
    transactions: [],
    summary: parseGenerated(PortfolioSummarySchema, summary, 'emptyPortfolioSummary'),
  };
}

// Pass the live ticker's quotes so holdings move with prices; defaults to the day's closing quotes.
export function generatePortfolioData(
  ctx: MockGeneratorContext,
  isEmptyScenario = false,
  liveQuotes?: readonly MarketQuoteDto[],
): PortfolioDataBundle {
  if (isEmptyScenario) {
    return emptyPortfolio(ctx);
  }

  const quotes = liveQuotes ?? generateInitialQuotes(ctx);
  const fxTable: readonly FxQuote[] = generateCurrentFxRates(ctx).map((rate) => ({
    from: rate.from,
    to: rate.to,
    rate: new Decimal(rate.rate),
  }));
  const valued = CANONICAL_INSTRUMENTS.filter((instrument) =>
    HELD_INSTRUMENT_IDS.includes(instrument.id),
  ).map((instrument, index) => valueHolding({ ctx, instrument, index, quotes }));

  const baseValues = valued.map((item) =>
    toBase(item.value, item.holding.currentValue.currency, fxTable),
  );
  const totalValue = baseValues.reduce((sum, value) => sum.plus(value), new Decimal(0));
  // Provisional: cost basis converts at today's rate, so currency effect is not yet separated.
  const totalCost = valued.reduce(
    (sum, item) => sum.plus(toBase(item.cost, item.holding.costBasis.currency, fxTable)),
    new Decimal(0),
  );
  const totalReturn = totalValue.minus(totalCost);

  const holdings = valued.map((item, index) => ({
    ...item.holding,
    allocationPercent: totalValue.isZero()
      ? 0
      : (baseValues[index] ?? new Decimal(0))
          .dividedBy(totalValue)
          .times(100)
          .toDecimalPlaces(1)
          .toNumber(),
  }));

  const summary: z.input<typeof PortfolioSummarySchema> = {
    totalValue: money(totalValue, BASE_CURRENCY),
    costBasis: money(totalCost, BASE_CURRENCY),
    unrealisedReturn: money(totalReturn, BASE_CURRENCY),
    unrealisedReturnPercent: totalCost.isZero()
      ? 0
      : totalReturn.dividedBy(totalCost).times(100).toDecimalPlaces(2).toNumber(),
    direction: directionOf(totalReturn),
    cashBalance: money(new Decimal('12450'), BASE_CURRENCY),
    activeHoldingsCount: holdings.length,
    asOf: ctx.referenceTime,
  };

  return {
    holdings: parseGeneratedList(HoldingSchema, holdings, 'holdings'),
    transactions: parseGeneratedList(
      TransactionSchema,
      [...valued.flatMap((item) => item.transactions), ...CASH_TRANSACTIONS],
      'transactions',
    ),
    summary: parseGenerated(PortfolioSummarySchema, summary, 'portfolioSummary'),
  };
}
