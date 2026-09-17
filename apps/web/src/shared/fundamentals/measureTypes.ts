// Shapes for derived fundamental measures (R-06; decision 53). One implementation serves the
// research endpoints, the screener and anything later, so a ratio cannot mean two things.

import type { FinancialStatementDto } from '../../data/schemas/financial-statements';

export type MeasureGroup = 'valuation' | 'profitability' | 'health' | 'growth' | 'cash';

// times: 18.4x. percent: 12.4%. number: a plain count such as a ratio of 1.2.
export type MeasureUnit = 'times' | 'percent' | 'number';

export interface ComputedMeasure {
  readonly id: string;
  readonly label: string;
  readonly group: MeasureGroup;
  readonly unit: MeasureUnit;
  // Null when the inputs it needs were not reported; `note` then says which.
  readonly value: number | null;
  // What the figure was computed from, so a reader can check it rather than trust it.
  readonly inputs: string;
  readonly periods: readonly string[];
  readonly note: string | null;
}

export interface MeasureRequest {
  // Annual statements on one basis, newest first.
  readonly annual: readonly FinancialStatementDto[];
  // Quarterly statements on the same basis, newest first.
  readonly quarterly: readonly FinancialStatementDto[];
  // Latest close per share in the reporting currency, or null when it is not comparable.
  readonly pricePerShare: string | null;
}

export type FlagSeverity = 'warning' | 'critical';

// An observation with its evidence attached. Never advice, never a recommendation (decision 52).
export interface FundamentalFlag {
  readonly id: string;
  readonly severity: FlagSeverity;
  readonly title: string;
  readonly evidence: string;
}
