// Holdings, purchase lots, transactions, and portfolio summary generator (M-09).
// Exercises multi-lot positions, fees, dividends, and empty-portfolio scenario support.

import type { z } from 'zod';
import { Decimal } from 'decimal.js';
import type { HoldingDto, LotDto, PortfolioSummaryDto, TransactionDto } from '../../schemas';
import { HoldingSchema, PortfolioSummarySchema, TransactionSchema } from '../../schemas';
import { parseGenerated, parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { CANONICAL_INSTRUMENTS } from './instruments';
import { currencyDecimals } from './values';
import { toIsoDate, toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { toInstrumentId } from '../../../shared/types/identifiers';
import { toQuantity } from '../../../shared/types/quantities';

export interface PortfolioDataBundle {
  readonly holdings: readonly HoldingDto[];
  readonly transactions: readonly TransactionDto[];
  readonly summary: PortfolioSummaryDto;
}

export function generatePortfolioData(
  ctx: MockGeneratorContext,
  isEmptyScenario = false,
): PortfolioDataBundle {
  const baseCurrency = 'USD';
  const dec = currencyDecimals(baseCurrency);

  if (isEmptyScenario) {
    const emptySummary: z.input<typeof PortfolioSummarySchema> = {
      totalValue: { amount: '0.00', currency: baseCurrency },
      costBasis: { amount: '0.00', currency: baseCurrency },
      unrealisedReturn: { amount: '0.00', currency: baseCurrency },
      unrealisedReturnPercent: 0,
      direction: 'neutral',
      cashBalance: { amount: '50000.00', currency: baseCurrency },
      activeHoldingsCount: 0,
      asOf: ctx.referenceTime,
    };
    return {
      holdings: [],
      transactions: [],
      summary: parseGenerated(PortfolioSummarySchema, emptySummary, 'emptyPortfolioSummary'),
    };
  }

  const selectedInstruments = CANONICAL_INSTRUMENTS.filter((inst) =>
    [
      'inst-us-aapl',
      'inst-us-spy',
      'inst-us-btc',
      'inst-us-gold',
      'inst-in-reliance',
      'inst-uk-azn',
      'inst-manual-bond',
    ].includes(inst.id),
  );

  const holdings: z.input<typeof HoldingSchema>[] = [];
  const transactions: z.input<typeof TransactionSchema>[] = [];
  let portTotalVal = new Decimal(0);
  let portCostBasis = new Decimal(0);

  selectedInstruments.forEach((inst, idx) => {
    const stream = ctx.random.fork(`holding:${inst.id}`);
    const holdingId = `hld-${idx + 1}`;
    const currDec = currencyDecimals(inst.currency);

    const hasMultipleLots = inst.symbol === 'AAPL' || inst.symbol === 'SPY';
    const lotCount = hasMultipleLots ? 3 : 1;
    const lots: LotDto[] = [];
    let hldQty = new Decimal(0);
    let hldCost = new Decimal(0);

    const priceSeed =
      inst.type === 'digital_asset' ? 62000 : inst.type === 'commodity' ? 2450 : 180;
    const currentPriceDec = new Decimal(priceSeed).times(stream.float(0.92, 1.15));

    for (let l = 1; l <= lotCount; l++) {
      const lotQty =
        inst.type === 'digital_asset'
          ? new Decimal(stream.float(0.05, 0.4)).toDecimalPlaces(4)
          : new Decimal(stream.int(10, 50));
      const costPerUnit = currentPriceDec.times(stream.float(0.8, 1.05)).toDecimalPlaces(currDec);
      const totalCost = lotQty.times(costPerUnit).toDecimalPlaces(currDec);
      const lotDate = toIsoDate(new Date(2023 + l - 1, (l * 3) % 12, 10 + l));

      lots.push({
        id: `lot-${holdingId}-${l}`,
        holdingId,
        purchaseDate: lotDate,
        quantity: toQuantity(lotQty.toNumber()),
        costPerUnit: { amount: costPerUnit.toFixed(currDec), currency: inst.currency },
        totalCost: { amount: totalCost.toFixed(currDec), currency: inst.currency },
      });

      hldQty = hldQty.plus(lotQty);
      hldCost = hldCost.plus(totalCost);

      transactions.push({
        id: `tx-${holdingId}-buy-${l}`,
        instrumentId: inst.id,
        type: 'buy',
        timestamp: toIsoUtcTimestamp(`${lotDate}T14:30:00Z`),
        quantity: lotQty.toNumber(),
        unitPrice: { amount: costPerUnit.toFixed(currDec), currency: inst.currency },
        fees: { amount: '1.50', currency: inst.currency },
        netAmount: { amount: totalCost.plus(1.5).toFixed(currDec), currency: inst.currency },
        notes: `Executed lot ${l} allocation`,
      });
    }

    const currVal = hldQty.times(currentPriceDec).toDecimalPlaces(currDec);
    const unGain = currVal.minus(hldCost);
    const unGainPct = hldCost.isZero() ? 0 : unGain.dividedBy(hldCost).times(100).abs().toNumber();

    holdings.push({
      id: holdingId,
      instrumentId: inst.id,
      quantity: hldQty.toNumber(),
      costBasis: { amount: hldCost.toFixed(currDec), currency: inst.currency },
      currentPrice: { amount: currentPriceDec.toFixed(currDec), currency: inst.currency },
      currentValue: { amount: currVal.toFixed(currDec), currency: inst.currency },
      unrealisedGainLoss: { amount: unGain.toFixed(currDec), currency: inst.currency },
      unrealisedGainLossPercent: Math.round(unGainPct * 100) / 100,
      direction: unGain.isZero() ? 'neutral' : unGain.isPositive() ? 'positive' : 'negative',
      allocationPercent: 0,
      lots,
    });

    const normalizedVal = inst.currency === 'INR' ? currVal.dividedBy(84) : currVal;
    const normalizedCost = inst.currency === 'INR' ? hldCost.dividedBy(84) : hldCost;
    portTotalVal = portTotalVal.plus(normalizedVal);
    portCostBasis = portCostBasis.plus(normalizedCost);
  });

  const validatedHoldings: z.input<typeof HoldingSchema>[] = holdings.map((h) => {
    const val = new Decimal(h.currentValue.amount);
    const alloc = portTotalVal.isZero()
      ? 0
      : Math.round(val.dividedBy(portTotalVal).times(100).toNumber() * 10) / 10;
    return { ...h, allocationPercent: alloc };
  });

  transactions.push(
    {
      id: 'tx-div-01',
      instrumentId: toInstrumentId('inst-us-aapl'),
      type: 'dividend',
      timestamp: toIsoUtcTimestamp('2025-02-15T18:00:00Z'),
      fees: { amount: '0.00', currency: 'USD' },
      netAmount: { amount: '24.50', currency: 'USD' },
      notes: 'Quarterly dividend payment received',
    },
    {
      id: 'tx-dep-01',
      type: 'deposit',
      timestamp: toIsoUtcTimestamp('2024-01-05T10:00:00Z'),
      fees: { amount: '0.00', currency: 'USD' },
      netAmount: { amount: '50000.00', currency: 'USD' },
      notes: 'Initial account funding from checking',
    },
  );

  const totalReturn = portTotalVal.minus(portCostBasis);
  const totalReturnPct = portCostBasis.isZero()
    ? 0
    : Math.round(totalReturn.dividedBy(portCostBasis).times(100).abs().toNumber() * 100) / 100;

  const summary: z.input<typeof PortfolioSummarySchema> = {
    totalValue: { amount: portTotalVal.toFixed(dec), currency: baseCurrency },
    costBasis: { amount: portCostBasis.toFixed(dec), currency: baseCurrency },
    unrealisedReturn: { amount: totalReturn.toFixed(dec), currency: baseCurrency },
    unrealisedReturnPercent: totalReturnPct,
    direction: totalReturn.isZero()
      ? 'neutral'
      : totalReturn.isPositive()
        ? 'positive'
        : 'negative',
    cashBalance: { amount: '12450.00', currency: baseCurrency },
    activeHoldingsCount: validatedHoldings.length,
    asOf: ctx.referenceTime,
  };

  return {
    holdings: parseGeneratedList(HoldingSchema, validatedHoldings, 'holdings'),
    transactions: parseGeneratedList(TransactionSchema, transactions, 'transactions'),
    summary: parseGenerated(PortfolioSummarySchema, summary, 'portfolioSummary'),
  };
}
