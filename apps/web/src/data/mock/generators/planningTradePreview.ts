// Proposed trade preview (UI spec 7.17): what a buy or sell would cost and how it would move each
// allocation dimension against its targets, before anything is committed. Nothing is ordered.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  AllocationPlanInput,
  InstrumentTypeConfigInput,
  TradePreviewRequestDto,
  TradePreviewSchema,
} from '../../schemas';
import type { CostConfig, Position } from './planningAllocation';
import {
  DIMENSIONS,
  allocationRows,
  currentPositions,
  estimateTradeCost,
} from './planningAllocation';
import type { ValuationContext } from './reportValuation';

export function buildTradePreview(
  request: TradePreviewRequestDto,
  v: ValuationContext,
  plan: AllocationPlanInput,
  date: string,
  costs: CostConfig & { readonly instrumentTypes: readonly InstrumentTypeConfigInput[] },
): z.input<typeof TradePreviewSchema> | string {
  const instrument = v.instrument(request.instrumentId);
  if (instrument === undefined) return 'Unknown instrument';
  const price = v.close(request.instrumentId, date);
  if (price === null) return `No price for ${instrument.symbol} on ${date}`;
  const { currency } = request;
  let units = new Decimal(request.quantity);
  if (units.isZero()) return 'Enter a quantity above zero';

  const warnings: string[] = [];
  if (!instrument.isFractionalAllowed && !units.isInteger()) {
    warnings.push(
      `${instrument.symbol} trades in whole units; the preview rounds down to ${units.floor().toString()}.`,
    );
    units = units.floor();
  }
  const before = currentPositions(v, date, currency);
  const held = before.find((item) => String(item.instrument.id) === request.instrumentId);
  if (request.side === 'sell') {
    if (held === undefined) return `${instrument.symbol} is not held, so there is nothing to sell`;
    if (units.gt(held.units)) {
      warnings.push(
        `Only ${held.units.toString()} ${instrument.symbol} are held; the preview sells all of them.`,
      );
      units = held.units;
    }
  }

  const fx = v.fx(instrument.currency, currency, date);
  const signed = request.side === 'buy' ? units : units.negated();
  const change = signed.times(price).times(fx);
  const after: Position[] =
    held === undefined
      ? [...before, { instrument, holding: null, units, price, value: change }]
      : before.map((item) =>
          item === held
            ? { ...item, units: item.units.plus(signed), value: item.value.plus(change) }
            : item,
        );

  const typeConfig = costs.instrumentTypes.find((item) => item.type === instrument.type);
  if (typeConfig?.manualOnly === true)
    warnings.push(`${instrument.type} is set to manual only: this trade would be entered by hand.`);
  if (typeConfig?.enabled === false)
    warnings.push(`${instrument.type} instruments are disabled in configuration.`);
  const broker =
    costs.brokers.find(
      (item) =>
        item.brokerId ===
        (held?.holding === null || held === undefined ? '' : String(held.holding.brokerId)),
    ) ?? costs.brokers.find((item) => item.markets.includes(String(instrument.marketId)));
  if (broker === undefined)
    warnings.push(`No configured broker covers ${String(instrument.marketId)}.`);
  else if (!broker.capabilities.placesOrders)
    warnings.push(`${broker.name} is tracked manually and does not place orders.`);

  const value = units.times(price);
  const cost = estimateTradeCost(
    instrument,
    broker?.brokerId ?? null,
    value,
    currency,
    date,
    v,
    costs,
  );
  const newlyOff = DIMENSIONS.flatMap((dimension) => {
    const beforeRows = allocationRows(before, plan, dimension, currency, v);
    return allocationRows(
      after.filter((item) => !item.value.isZero()),
      plan,
      dimension,
      currency,
      v,
    )
      .filter(
        (row) =>
          (row.status === 'over' || row.status === 'under') &&
          beforeRows.find((old) => old.key === row.key)?.status === 'within',
      )
      .map(
        (row) =>
          `${row.label} would move outside its target (${String(row.actualPercent)}% against ${String(row.targetPercent)}%).`,
      );
  });
  warnings.push(...newlyOff);

  return {
    currency,
    symbol: instrument.symbol,
    side: request.side,
    quantity: units.toString(),
    price: { amount: price.toFixed(4), currency: instrument.currency },
    value: { amount: value.times(fx).toFixed(2), currency },
    estimatedCost: { amount: cost.total.toFixed(2), currency },
    costBreakdown: cost.breakdown.map((item) => ({
      label: item.label,
      amount: { amount: item.amount.toFixed(2), currency },
    })),
    before: DIMENSIONS.map((dimension) => ({
      dimension,
      rows: allocationRows(before, plan, dimension, currency, v),
    })),
    after: DIMENSIONS.map((dimension) => ({
      dimension,
      rows: allocationRows(
        after.filter((item) => !item.value.isZero()),
        plan,
        dimension,
        currency,
        v,
      ),
    })),
    warnings,
  };
}
