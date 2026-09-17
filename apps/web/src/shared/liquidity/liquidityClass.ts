// How quickly a holding could become spendable cash (requirements 30; UI spec 19.2). Pure, shared by
// Holdings and Planning: manual-only instruments have no exchange to sell on; everything else is
// judged by its settlement cycle.

export type LiquidityClass = 'days' | 'weeks' | 'months';

export interface LiquidityInput {
  readonly settlementDays: number;
  readonly manualOnly: boolean;
}

export interface Liquidity {
  readonly liquidityClass: LiquidityClass;
  readonly label: string;
  readonly detail: string;
}

// Settlement beyond a business week is no longer "a few days" once weekends are counted.
const DAYS_LIMIT = 5;

export const LIQUIDITY_LABEL: Readonly<Record<LiquidityClass, string>> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months or longer',
};

export function liquidityOf(input: LiquidityInput): Liquidity {
  if (input.manualOnly) {
    return {
      liquidityClass: 'months',
      label: LIQUIDITY_LABEL.months,
      detail: 'No exchange: needs a private buyer',
    };
  }
  const cycle = `Settles T+${String(input.settlementDays)}`;
  return input.settlementDays <= DAYS_LIMIT
    ? { liquidityClass: 'days', label: LIQUIDITY_LABEL.days, detail: cycle }
    : { liquidityClass: 'weeks', label: LIQUIDITY_LABEL.weeks, detail: cycle };
}
