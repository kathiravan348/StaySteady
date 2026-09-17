// Assembles every derived measure for one company (R-06; decision 53). Pure: no fetching, no
// React. A measure whose inputs were not reported comes back null with a note, never zero.

import { Decimal } from 'decimal.js';

import type { ComputedMeasure, MeasureRequest } from './measureTypes';
import type { Context } from './measureContext';
import { HEALTH_MEASURES } from './healthMeasures';
import { VALUATION_MEASURES } from './valuationMeasures';

const BUILDERS = [...VALUATION_MEASURES, ...HEALTH_MEASURES];

export function computeMeasures(request: MeasureRequest): ComputedMeasure[] {
  const latest = request.annual[0];
  if (latest === undefined) return [];
  const price = request.pricePerShare === null ? null : new Decimal(request.pricePerShare);
  const context: Context = {
    latest,
    annual: request.annual,
    quarterly: request.quarterly,
    price,
    // Market value is always price times shares outstanding, never a stored figure (decision 19).
    marketCap: price === null ? null : price.times(latest.balanceSheet.sharesOutstanding),
  };
  return BUILDERS.map((builder) => {
    const result = builder.compute(context);
    return {
      id: builder.id,
      label: builder.label,
      group: builder.group,
      unit: builder.unit,
      value: result.value,
      inputs: result.inputs,
      periods: [latest.fiscalPeriod],
      note: result.note ?? null,
    };
  });
}

export function marketCapFor(pricePerShare: string, sharesOutstanding: number): Decimal {
  return new Decimal(pricePerShare).times(sharesOutstanding);
}
