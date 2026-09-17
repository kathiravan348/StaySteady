// Sector and business-group exposure across the traded portfolio (R-03; decision 51).
// Exposure held through a fund counts: a sector limit that ignored funds would understate the real
// position. Instruments with no company behind them (gold, crypto, a private note) carry no sector,
// so they are reported as an uncovered share rather than hidden or lumped into one.

import { Decimal } from 'decimal.js';

import type { FxQuote } from '../../../shared/money';
import type { HoldingDto, InstrumentDto } from '../../schemas';
import { sectorNameForSymbol } from './classification';
import { GROUP_ID_BY_SYMBOL, GROUPS } from './classificationAssignments';
import { fundLookThroughFor } from './fundLookThrough';
import { getInstrumentById } from './instruments';
import type { MockGeneratorContext } from './mockContext';
import { toBase } from './riskMeasures';

export interface ExposureSlice {
  readonly key: string;
  // Share of the whole portfolio, direct and through funds together.
  readonly percent: number;
  readonly directPercent: number;
  readonly viaFundsPercent: number;
  readonly instruments: readonly string[];
}

export interface ExposureBreakdown {
  readonly slices: readonly ExposureSlice[];
  readonly largest: ExposureSlice | null;
  // Share of the portfolio this measure can speak for at all.
  readonly coveredPercent: number;
  readonly uncoveredPercent: number;
  readonly uncoveredNote: string | null;
}

interface Bucket {
  direct: Decimal;
  viaFunds: Decimal;
  instruments: Set<string>;
}

const round = (value: Decimal): number => Number(value.toDecimalPlaces(2).toNumber().toFixed(2));

function emptyBucket(): Bucket {
  return { direct: new Decimal(0), viaFunds: new Decimal(0), instruments: new Set<string>() };
}

type KeyOf = (symbol: string) => string | null;

// One pass over the holdings: a company's value lands on its own key, a fund's value is split
// across the keys its holdings imply, and anything else raises the uncovered share.
function build(
  holdings: readonly HoldingDto[],
  fx: readonly FxQuote[],
  keyOf: KeyOf,
  fundSplit: (instrument: InstrumentDto) => readonly (readonly [string, number])[],
): { buckets: Map<string, Bucket>; total: Decimal; uncovered: Decimal } {
  const buckets = new Map<string, Bucket>();
  let total = new Decimal(0);
  let uncovered = new Decimal(0);

  const add = (key: string, symbol: string, amount: Decimal, viaFund: boolean): void => {
    const bucket = buckets.get(key) ?? emptyBucket();
    if (viaFund) {
      bucket.viaFunds = bucket.viaFunds.plus(amount);
    } else {
      bucket.direct = bucket.direct.plus(amount);
    }
    bucket.instruments.add(symbol);
    buckets.set(key, bucket);
  };

  for (const holding of holdings) {
    const instrument = getInstrumentById(String(holding.instrumentId));
    if (instrument === undefined) continue;
    const value = toBase(
      new Decimal(holding.currentValue.amount),
      holding.currentValue.currency,
      fx,
    );
    total = total.plus(value);

    const ownKey = keyOf(instrument.symbol);
    if (ownKey !== null) {
      add(ownKey, instrument.symbol, value, false);
      continue;
    }
    const split = fundSplit(instrument);
    if (split.length === 0) {
      uncovered = uncovered.plus(value);
      continue;
    }
    let attributed = new Decimal(0);
    for (const [key, weightPercent] of split) {
      const share = value.times(weightPercent).dividedBy(100);
      attributed = attributed.plus(share);
      add(key, instrument.symbol, share, true);
    }
    // A fund's disclosed weights rarely add to exactly 100; the rest is honestly uncovered.
    uncovered = uncovered.plus(value.minus(attributed));
  }
  return { buckets, total, uncovered };
}

function breakdown(
  buckets: Map<string, Bucket>,
  total: Decimal,
  uncovered: Decimal,
  uncoveredNote: string | null,
): ExposureBreakdown {
  if (total.isZero()) {
    return {
      slices: [],
      largest: null,
      coveredPercent: 0,
      uncoveredPercent: 0,
      uncoveredNote: null,
    };
  }
  const share = (amount: Decimal): Decimal => amount.dividedBy(total).times(100);
  const slices = [...buckets.entries()]
    .map(([key, bucket]) => ({
      key,
      percent: round(share(bucket.direct.plus(bucket.viaFunds))),
      directPercent: round(share(bucket.direct)),
      viaFundsPercent: round(share(bucket.viaFunds)),
      instruments: [...bucket.instruments].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.percent - a.percent);
  const uncoveredPercent = round(share(uncovered));
  return {
    slices,
    largest: slices[0] ?? null,
    coveredPercent: round(new Decimal(100).minus(uncoveredPercent)),
    uncoveredPercent,
    uncoveredNote: uncoveredPercent > 0 ? uncoveredNote : null,
  };
}

export function sectorExposure(
  ctx: MockGeneratorContext,
  holdings: readonly HoldingDto[],
  fx: readonly FxQuote[],
): ExposureBreakdown {
  const { buckets, total, uncovered } = build(
    holdings,
    fx,
    (symbol) => sectorNameForSymbol(symbol),
    (instrument) =>
      fundLookThroughFor(ctx, instrument)?.sectorWeights.map(
        (weight) => [weight.sectorName, weight.weightPercent] as const,
      ) ?? [],
  );
  return breakdown(
    buckets,
    total,
    uncovered,
    'Commodities, digital assets, currencies and private credit carry no sector, and a fund leaves a small share unclassified.',
  );
}

export function groupExposure(
  ctx: MockGeneratorContext,
  holdings: readonly HoldingDto[],
  fx: readonly FxQuote[],
): ExposureBreakdown {
  const groupOf = (symbol: string): string | null => {
    const groupId = GROUP_ID_BY_SYMBOL[symbol];
    return groupId === undefined ? null : (GROUPS[groupId] ?? null);
  };
  const { buckets, total, uncovered } = build(holdings, fx, groupOf, (instrument) =>
    (fundLookThroughFor(ctx, instrument)?.topHoldings ?? []).flatMap((item) =>
      item.groupName === null ? [] : [[item.groupName, item.weightPercent] as const],
    ),
  );
  return breakdown(
    buckets,
    total,
    uncovered,
    'Most holdings belong to no business group, and only a fund’s largest holdings are disclosed.',
  );
}
