// Allocation planning (UI spec 7.17): current positions grouped by instrument type, country, currency
// and sector, compared with targets, and the trades that would bring drift back within tolerance.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  AllocationDimensionDto,
  AllocationPlanInput,
  AllocationRowSchema,
  AllocationViewSchema,
  BrokerConfigInput,
  CurrencyConfigInput,
  HoldingDto,
  InstrumentDto,
  ReportCurrencyDto,
  SuggestedTradeSchema,
} from '../../schemas';
import { instrumentTypeLabel } from '../../../shared/format';
import type { ValuationContext } from './reportValuation';
import { SECTORS } from './researchData';

const ZERO = new Decimal(0);
export const DIMENSIONS: readonly AllocationDimensionDto[] = [
  'type',
  'country',
  'currency',
  'sector',
];
const UNCLASSIFIED = 'Not classified';

export interface Position {
  readonly instrument: InstrumentDto;
  readonly holding: HoldingDto | null;
  readonly units: Decimal;
  // Price in the instrument's currency and value in the report currency.
  readonly price: Decimal;
  readonly value: Decimal;
}

export function bucketOf(
  position: Pick<Position, 'instrument'>,
  dimension: AllocationDimensionDto,
  v: ValuationContext,
): { key: string; label: string } {
  const { instrument } = position;
  switch (dimension) {
    case 'type':
      return { key: instrument.type, label: instrumentTypeLabel(instrument.type) };
    case 'country': {
      const country =
        v.markets.find((market) => market.marketId === String(instrument.marketId))?.country ??
        String(instrument.marketId);
      return { key: country, label: country };
    }
    case 'currency':
      return { key: instrument.currency, label: instrument.currency };
    case 'sector': {
      const sector = SECTORS[instrument.symbol] ?? UNCLASSIFIED;
      return { key: sector, label: sector };
    }
  }
}

export function currentPositions(
  v: ValuationContext,
  date: string,
  currency: ReportCurrencyDto,
): Position[] {
  return v.holdings.flatMap((holding) => {
    const instrument = v.instrument(String(holding.instrumentId));
    const price = v.close(String(holding.instrumentId), date);
    const units = v.quantity(holding, date);
    if (instrument === undefined || price === null || units.isZero()) return [];
    return [
      {
        instrument,
        holding,
        units,
        price,
        value: units.times(price).times(v.fx(instrument.currency, currency, date)),
      },
    ];
  });
}

type Row = z.input<typeof AllocationRowSchema>;

export function allocationRows(
  positions: readonly Position[],
  plan: AllocationPlanInput,
  dimension: AllocationDimensionDto,
  currency: ReportCurrencyDto,
  v: ValuationContext,
): Row[] {
  const total = positions.reduce((sum, item) => sum.plus(item.value), ZERO);
  const buckets = new Map<string, { label: string; value: Decimal }>();
  positions.forEach((item) => {
    const bucket = bucketOf(item, dimension, v);
    const current = buckets.get(bucket.key);
    buckets.set(bucket.key, {
      label: bucket.label,
      value: (current?.value ?? ZERO).plus(item.value),
    });
  });
  const targets = plan.targets.filter((target) => target.dimension === dimension);
  targets.forEach((target) => {
    if (!buckets.has(target.key)) {
      buckets.set(target.key, {
        label: dimension === 'type' ? instrumentTypeLabel(target.key) : target.key,
        value: ZERO,
      });
    }
  });
  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const actualPercent = total.isZero()
        ? 0
        : Number(bucket.value.dividedBy(total).times(100).toFixed(2));
      const target = targets.find((item) => item.key === key);
      const drift =
        target === undefined ? null : Number((actualPercent - target.targetPercent).toFixed(2));
      const status: Row['status'] =
        drift === null
          ? 'untargeted'
          : Math.abs(drift) <= plan.tolerancePercent
            ? 'within'
            : drift > 0
              ? 'over'
              : 'under';
      return {
        key,
        label: bucket.label,
        actual: { amount: bucket.value.toFixed(2), currency },
        actualPercent,
        targetPercent: target?.targetPercent ?? null,
        driftPercent: drift,
        status,
      };
    })
    .sort((a, b) => b.actualPercent - a.actualPercent);
}

export interface CostConfig {
  readonly brokers: readonly BrokerConfigInput[];
  readonly currencies: readonly CurrencyConfigInput[];
}

// Commission from the holding's broker fee rules plus the conversion cost for non-USD instruments,
// in the report currency. An estimate: spread and slippage are not included.
export function estimateTradeCost(
  instrument: InstrumentDto,
  brokerId: string | null,
  valueInInstrumentCurrency: Decimal,
  currency: ReportCurrencyDto,
  date: string,
  v: ValuationContext,
  costs: CostConfig,
): { total: Decimal; breakdown: { label: string; amount: Decimal }[] } {
  const toReport = v.fx(instrument.currency, currency, date);
  const broker =
    costs.brokers.find((item) => item.brokerId === brokerId) ??
    costs.brokers.find((item) => item.markets.includes(String(instrument.marketId)));
  const fees = broker?.fees;
  let commission = ZERO;
  if (fees?.model === 'percentage') {
    commission = Decimal.max(
      valueInInstrumentCurrency.times(fees.commissionBps).dividedBy(10_000),
      new Decimal(fees.minimumPerOrder),
    );
  } else if (fees?.model === 'flat') {
    commission = new Decimal(fees.flatPerOrder);
  }
  const conversionBps =
    instrument.currency === 'USD'
      ? 0
      : (costs.currencies.find((item) => item.currency === instrument.currency)
          ?.conversionCostBps ?? 25);
  const conversion = valueInInstrumentCurrency.times(conversionBps).dividedBy(10_000);
  const breakdown = [
    {
      label: `Commission (${broker?.name ?? 'no broker configured'})`,
      amount: commission.times(toReport),
    },
    {
      label: `Currency conversion (${String(conversionBps)} bps)`,
      amount: conversion.times(toReport),
    },
  ];
  return { total: breakdown.reduce((sum, item) => sum.plus(item.amount), ZERO), breakdown };
}

type Suggestion = z.input<typeof SuggestedTradeSchema>;

export function suggestTrades(
  positions: readonly Position[],
  plan: AllocationPlanInput,
  currency: ReportCurrencyDto,
  date: string,
  v: ValuationContext,
  costs: CostConfig,
): Suggestion[] {
  const total = positions.reduce((sum, item) => sum.plus(item.value), ZERO);
  if (total.isZero()) return [];
  return DIMENSIONS.flatMap((dimension) =>
    allocationRows(positions, plan, dimension, currency, v)
      .filter((row) => row.status === 'over' || row.status === 'under')
      .map((row) => {
        const target = row.targetPercent ?? 0;
        const amount = total.times(target - row.actualPercent).dividedBy(100);
        const side = amount.isPositive() ? 'buy' : 'sell';
        const inBucket = positions
          .filter((item) => bucketOf(item, dimension, v).key === row.key)
          .sort((a, b) => b.value.comparedTo(a.value))[0];
        const reason = `${row.label} is ${String(row.actualPercent)}% against a ${String(target)}% target (${side === 'buy' ? 'under' : 'over'} by ${Math.abs(row.driftPercent ?? 0).toFixed(1)} points).`;
        const base: Suggestion = {
          id: `${dimension}-${row.key}`,
          dimension,
          bucket: row.label,
          side,
          instrumentId: null,
          symbol: null,
          quantity: null,
          value: { amount: amount.abs().toFixed(2), currency },
          estimatedCost: { amount: '0.00', currency },
          reason: `${reason} Nothing in this bucket is held, so choose an instrument to buy.`,
        };
        if (inBucket === undefined) return base;
        const unitValue = inBucket.price.times(v.fx(inBucket.instrument.currency, currency, date));
        const raw = amount.abs().dividedBy(unitValue);
        let units = inBucket.instrument.isFractionalAllowed
          ? raw.toDecimalPlaces(4, Decimal.ROUND_DOWN)
          : raw.floor();
        if (side === 'sell') units = Decimal.min(units, inBucket.units);
        if (units.isZero()) {
          return {
            ...base,
            reason: `${reason} The difference is smaller than one unit of ${inBucket.instrument.symbol}.`,
          };
        }
        const brokerId = inBucket.holding === null ? null : String(inBucket.holding.brokerId);
        const manual =
          costs.brokers.find((item) => item.brokerId === brokerId)?.connection === 'manual';
        const value = units.times(inBucket.price);
        const cost = estimateTradeCost(
          inBucket.instrument,
          inBucket.holding === null ? null : String(inBucket.holding.brokerId),
          value,
          currency,
          date,
          v,
          costs,
        );
        return {
          ...base,
          instrumentId: String(inBucket.instrument.id),
          symbol: inBucket.instrument.symbol,
          quantity: units.toString(),
          value: {
            amount: value.times(v.fx(inBucket.instrument.currency, currency, date)).toFixed(2),
            currency,
          },
          estimatedCost: { amount: cost.total.toFixed(2), currency },
          reason: `${reason} ${side === 'buy' ? 'Adds to' : 'Trims'} the largest holding in it, ${inBucket.instrument.symbol}.${manual ? ' Its broker is tracked manually, so this would be arranged outside the platform.' : ''}`,
        };
      }),
  );
}

export function buildAllocationView(
  v: ValuationContext,
  plan: AllocationPlanInput,
  saved: { savedAt: string; reason: string },
  currency: ReportCurrencyDto,
  asOf: string,
  costs: CostConfig,
): z.input<typeof AllocationViewSchema> {
  const positions = currentPositions(v, asOf, currency);
  const total = positions.reduce((sum, item) => sum.plus(item.value), ZERO);
  return {
    currency,
    asOf,
    total: { amount: total.toFixed(2), currency },
    plan,
    savedAt: saved.savedAt,
    savedReason: saved.reason,
    dimensions: DIMENSIONS.map((dimension) => ({
      dimension,
      rows: allocationRows(positions, plan, dimension, currency, v),
    })),
    suggestions: suggestTrades(positions, plan, currency, asOf, v, costs),
    notes: [
      `Values at the ${asOf} close in ${currency}. Cash and assets outside the brokers are not included yet (S-30).`,
      'Only individual stocks carry a sector; funds, commodities, crypto and bonds show as Not classified.',
      'Suggested trades are estimates to consider. Nothing is ordered or sent for approval from here.',
      'Each dimension is balanced on its own, so suggestions for type and currency can overlap; preview a trade to see its effect on all four.',
    ],
  };
}
