// Financial statements as reported (requirements 37; decision 50). Five years annual and eight
// quarters interim, consolidated and standalone kept distinct, each period carrying its currency,
// period end, audit and restatement state and — required, not optional — the date it was published.
// Without the publication date a backtest can use figures nobody had yet, and every rule built on
// fundamentals scores better than it could have in reality.

import { z } from 'zod';

import { CurrencyCodeSchema, InstrumentIdSchema, IsoDateSchema, MoneySchema } from './common';

export const StatementPeriodTypeSchema = z.enum(['annual', 'quarter']);
export type StatementPeriodType = z.infer<typeof StatementPeriodTypeSchema>;

// Consolidated includes subsidiaries, standalone does not. Indian companies publish both, and
// mixing them silently gives a wrong answer (Tata Motors without Jaguar Land Rover is a third of
// the business).
export const StatementBasisSchema = z.enum(['consolidated', 'standalone']);
export type StatementBasis = z.infer<typeof StatementBasisSchema>;

export const BalanceSheetSchema = z.object({
  totalAssets: MoneySchema,
  currentAssets: MoneySchema,
  cashAndEquivalents: MoneySchema,
  totalLiabilities: MoneySchema,
  currentLiabilities: MoneySchema,
  totalDebt: MoneySchema,
  shareholdersEquity: MoneySchema,
  sharesOutstanding: z.number().positive(),
});
export type BalanceSheetDto = z.infer<typeof BalanceSheetSchema>;

export const IncomeStatementSchema = z.object({
  revenue: MoneySchema,
  grossProfit: MoneySchema,
  operatingProfit: MoneySchema,
  ebitda: MoneySchema,
  netProfit: MoneySchema,
  taxExpense: MoneySchema,
  earningsPerShare: z.number(),
});
export type IncomeStatementDto = z.infer<typeof IncomeStatementSchema>;

export const CashFlowStatementSchema = z.object({
  operatingCashFlow: MoneySchema,
  capitalExpenditure: MoneySchema,
  freeCashFlow: MoneySchema,
  dividendsPaid: MoneySchema,
  netDebtRaised: MoneySchema,
});
export type CashFlowStatementDto = z.infer<typeof CashFlowStatementSchema>;

const amount = (money: { readonly amount: string }): number => Number(money.amount);

export const FinancialStatementSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    periodType: StatementPeriodTypeSchema,
    basis: StatementBasisSchema,
    // How the company labels it: "FY2026" or "Q2 FY2026".
    fiscalPeriod: z.string().min(1),
    periodEnd: IsoDateSchema,
    reportingCurrency: CurrencyCodeSchema,
    isAudited: z.boolean(),
    isRestated: z.boolean(),
    restatementNote: z.string().min(1).nullable(),
    publishedOn: IsoDateSchema,
    balanceSheet: BalanceSheetSchema,
    income: IncomeStatementSchema,
    cashFlow: CashFlowStatementSchema,
  })
  .refine((value) => value.periodEnd <= value.publishedOn, {
    error: 'A statement cannot be published before the period it covers has ended',
    path: ['publishedOn'],
  })
  .refine((value) => !value.isRestated || value.restatementNote !== null, {
    error: 'A restated statement must say what was restated',
    path: ['restatementNote'],
  })
  .refine(
    (value) => {
      const { totalAssets, totalLiabilities, shareholdersEquity } = value.balanceSheet;
      const difference = Math.abs(
        amount(totalAssets) - amount(totalLiabilities) - amount(shareholdersEquity),
      );
      // One currency unit of tolerance for rounding each side of the sheet.
      return difference <= Math.max(1, amount(totalAssets) * 1e-9);
    },
    {
      error: 'Total assets must equal total liabilities plus shareholders equity',
      path: ['balanceSheet', 'totalAssets'],
    },
  )
  .refine(
    (value) => {
      const { operatingCashFlow, capitalExpenditure, freeCashFlow } = value.cashFlow;
      const difference = Math.abs(
        amount(operatingCashFlow) - amount(capitalExpenditure) - amount(freeCashFlow),
      );
      return difference <= Math.max(1, Math.abs(amount(operatingCashFlow)) * 1e-9);
    },
    {
      error: 'Free cash flow must equal operating cash flow less capital expenditure',
      path: ['cashFlow', 'freeCashFlow'],
    },
  )
  .refine(
    (value) => {
      const expected = amount(value.income.netProfit) / value.balanceSheet.sharesOutstanding;
      return Math.abs(expected - value.income.earningsPerShare) <= 0.02;
    },
    {
      error: 'Earnings per share must follow from net profit and shares outstanding',
      path: ['income', 'earningsPerShare'],
    },
  );
export type FinancialStatementDto = z.infer<typeof FinancialStatementSchema>;

export const FinancialStatementsSchema = z.object({
  instrumentId: InstrumentIdSchema,
  reportingCurrency: CurrencyCodeSchema,
  fiscalYearEnd: z.string().min(1),
  basesAvailable: z.array(StatementBasisSchema).min(1),
  // Newest first, so the latest reported period is the first thing a consumer reads.
  annual: z.array(FinancialStatementSchema).min(1),
  quarterly: z.array(FinancialStatementSchema),
  asOf: IsoDateSchema,
  source: z.string().min(1),
  note: z.string().min(1),
});
export type FinancialStatementsDto = z.infer<typeof FinancialStatementsSchema>;

export const FinancialStatementsResponseSchema = z
  .object({
    instrumentId: InstrumentIdSchema,
    statements: FinancialStatementsSchema.nullable(),
    unavailableReason: z.string().min(1).nullable(),
  })
  .refine((value) => (value.statements === null) !== (value.unavailableReason === null), {
    error: 'Either the statements or the reason they are unavailable, never both or neither',
    path: ['unavailableReason'],
  });
export type FinancialStatementsResponseDto = z.infer<typeof FinancialStatementsResponseSchema>;
