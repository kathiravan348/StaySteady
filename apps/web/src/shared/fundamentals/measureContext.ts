// Shared internals for the fundamental measures (R-06): decimal helpers, the context every
// measure reads, and the growth helper two of them use. Kept separate so no measures file grows
// past the file length limit (decision 18).

import { Decimal } from 'decimal.js';

import type { FinancialStatementDto } from '../../data/schemas/financial-statements';
import type { MeasureGroup, MeasureUnit } from './measureTypes';

export const money = (value: { readonly amount: string }): Decimal => new Decimal(value.amount);

export function ratio(numerator: Decimal, denominator: Decimal): number | null {
  return denominator.isZero() ? null : Number(numerator.dividedBy(denominator).toFixed(4));
}

export function percent(numerator: Decimal, denominator: Decimal): number | null {
  const value = ratio(numerator, denominator);
  return value === null ? null : Number((value * 100).toFixed(2));
}

export interface Builder {
  readonly id: string;
  readonly label: string;
  readonly group: MeasureGroup;
  readonly unit: MeasureUnit;
  readonly compute: (context: Context) => { value: number | null; inputs: string; note?: string };
}

export interface Context {
  readonly latest: FinancialStatementDto;
  readonly annual: readonly FinancialStatementDto[];
  readonly quarterly: readonly FinancialStatementDto[];
  readonly price: Decimal | null;
  readonly marketCap: Decimal | null;
}

export const NO_PRICE =
  'No comparable price in the reporting currency, so this cannot be computed.';

// Compound annual growth between the newest and oldest of `years` reported years.
export function growth(
  context: Context,
  years: number,
  pick: (s: FinancialStatementDto) => Decimal,
) {
  const newest = context.annual[0];
  const oldest = context.annual[years];
  if (newest === undefined || oldest === undefined) {
    return {
      value: null,
      inputs: `Needs ${String(years + 1)} reported years; fewer are available.`,
    };
  }
  const from = pick(oldest);
  const to = pick(newest);
  if (!from.isPositive() || !to.isPositive()) {
    return {
      value: null,
      inputs: `${oldest.fiscalPeriod} or ${newest.fiscalPeriod} was not positive, so a growth rate would mislead.`,
    };
  }
  const rate = Math.pow(to.dividedBy(from).toNumber(), 1 / years) - 1;
  return {
    value: Number((rate * 100).toFixed(2)),
    inputs: `${newest.fiscalPeriod} against ${oldest.fiscalPeriod}, compounded over ${String(years)} years.`,
  };
}

export { Decimal };
