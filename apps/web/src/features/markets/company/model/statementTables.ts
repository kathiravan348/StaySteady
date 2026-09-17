// Which lines each statement table shows, and how a period's figures are read off it (R-08).
// Pure: the tab renders what this describes, so the three statements stay in one place.

import type { FinancialStatementDto } from '../../../../data/schemas';
import type { MoneyDto } from '../../../../data/schemas';

export interface StatementLine {
  readonly id: string;
  readonly label: string;
  readonly pick: (statement: FinancialStatementDto) => MoneyDto;
  // A line that is a sum of the ones above it, shown with more weight.
  readonly isTotal?: boolean;
}

export interface StatementTable {
  readonly id: 'balance' | 'income' | 'cash';
  readonly title: string;
  readonly lines: readonly StatementLine[];
}

export const STATEMENT_TABLES: readonly StatementTable[] = [
  {
    id: 'income',
    title: 'Income statement',
    lines: [
      { id: 'revenue', label: 'Revenue', pick: (s) => s.income.revenue, isTotal: true },
      { id: 'gross', label: 'Gross profit', pick: (s) => s.income.grossProfit },
      { id: 'operating', label: 'Operating profit', pick: (s) => s.income.operatingProfit },
      { id: 'ebitda', label: 'EBITDA', pick: (s) => s.income.ebitda },
      { id: 'interest', label: 'Interest paid', pick: (s) => s.income.interestExpense },
      { id: 'tax', label: 'Tax', pick: (s) => s.income.taxExpense },
      { id: 'net', label: 'Net profit', pick: (s) => s.income.netProfit, isTotal: true },
    ],
  },
  {
    id: 'balance',
    title: 'Balance sheet',
    lines: [
      { id: 'cash', label: 'Cash and equivalents', pick: (s) => s.balanceSheet.cashAndEquivalents },
      { id: 'currentAssets', label: 'Current assets', pick: (s) => s.balanceSheet.currentAssets },
      {
        id: 'totalAssets',
        label: 'Total assets',
        pick: (s) => s.balanceSheet.totalAssets,
        isTotal: true,
      },
      {
        id: 'currentLiabilities',
        label: 'Current liabilities',
        pick: (s) => s.balanceSheet.currentLiabilities,
      },
      { id: 'debt', label: 'Total debt', pick: (s) => s.balanceSheet.totalDebt },
      {
        id: 'totalLiabilities',
        label: 'Total liabilities',
        pick: (s) => s.balanceSheet.totalLiabilities,
        isTotal: true,
      },
      {
        id: 'equity',
        label: 'Shareholders equity',
        pick: (s) => s.balanceSheet.shareholdersEquity,
        isTotal: true,
      },
    ],
  },
  {
    id: 'cash',
    title: 'Cash flow',
    lines: [
      {
        id: 'operatingCash',
        label: 'Operating cash flow',
        pick: (s) => s.cashFlow.operatingCashFlow,
      },
      {
        id: 'capex',
        label: 'Capital expenditure',
        pick: (s) => s.cashFlow.capitalExpenditure,
      },
      {
        id: 'free',
        label: 'Free cash flow',
        pick: (s) => s.cashFlow.freeCashFlow,
        isTotal: true,
      },
      { id: 'dividends', label: 'Dividends paid', pick: (s) => s.cashFlow.dividendsPaid },
      { id: 'debtRaised', label: 'Net debt raised', pick: (s) => s.cashFlow.netDebtRaised },
    ],
  },
];

// Periods on one basis and period type, newest first, limited to what a table can show at once.
export function periodsFor(
  statements: readonly FinancialStatementDto[],
  basis: string,
  periodType: 'annual' | 'quarter',
  limit: number,
): FinancialStatementDto[] {
  return statements
    .filter((statement) => statement.basis === basis && statement.periodType === periodType)
    .slice(0, limit);
}

// Change against the period to its right in the table, which is the one a year or a quarter earlier.
export function changePercent(current: string, previous: string): number | null {
  const from = Number(previous);
  const to = Number(current);
  if (!Number.isFinite(from) || from === 0) return null;
  return Number((((to - from) / Math.abs(from)) * 100).toFixed(1));
}
