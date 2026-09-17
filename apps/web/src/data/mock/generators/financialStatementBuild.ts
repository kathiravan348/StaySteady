// Builds one reported period from a company's statement seed (R-05). Every line is derived, so the
// balance sheet balances, free cash flow follows from operating cash flow less capital spending,
// and earnings per share follows from net profit and shares. The schema re-checks all three.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { CurrencyCode } from '../../../shared/types/currency';
import type { FinancialStatementSchema, StatementBasis } from '../../schemas';
import type { StatementSeed } from './financialStatementSeeds';
import { currencyDecimals } from './values';

type StatementInput = z.input<typeof FinancialStatementSchema>;

// Current assets as a share of total assets, and the share of those held as cash. Constant across
// companies: the seed already carries the current ratio, which sets current liabilities from these.
const CURRENT_ASSET_SHARE = 0.35;
const CASH_SHARE_OF_CURRENT = 0.3;
const DEPRECIATION_TO_CAPEX = 0.9;
const TAX_RATE = 0.22;
// Blended cost of borrowing applied to total debt, prorated for an interim period.
const INTEREST_RATE = 0.06;

export interface PeriodParams {
  readonly instrumentId: string;
  readonly seed: StatementSeed;
  readonly basis: StatementBasis;
  readonly periodType: 'annual' | 'quarter';
  readonly fiscalPeriod: string;
  readonly periodEnd: string;
  readonly publishedOn: string;
  // Revenue for this period, in millions of the reporting currency.
  readonly revenueMillions: number;
  // Balance sheet scale for this period; a quarter reports the same sheet as its year to date.
  readonly annualRevenueMillions: number;
  readonly isAudited: boolean;
  readonly isRestated: boolean;
  readonly restatementNote: string | null;
  readonly forceNegativeFreeCashFlow: boolean;
  // 0 for the latest reported year, 1 for the year before it, and so on. Margins, capital spending
  // and leverage vary with it, so a ratio has a history worth looking at instead of a flat line.
  readonly periodIndex: number;
}

// Deterministic, smooth and small: the same period always produces the same figures.
function variation(periodIndex: number, amplitude: number, phase: number): number {
  return 1 + amplitude * Math.sin(periodIndex * 1.7 + phase);
}

const MILLION = new Decimal(1_000_000);

export function buildStatement(params: PeriodParams): StatementInput {
  const { seed, basis } = params;
  const scale = basis === 'standalone' ? (seed.standaloneShareOfRevenue ?? 1) : 1;
  const currency: CurrencyCode = seed.currency;
  const decimals = currencyDecimals(currency);
  const money = (value: Decimal): { amount: string; currency: CurrencyCode } => ({
    amount: value.toFixed(decimals),
    currency,
  });

  const revenue = new Decimal(params.revenueMillions).times(scale).times(MILLION);
  const annualRevenue = new Decimal(params.annualRevenueMillions).times(scale).times(MILLION);

  // Balance sheet: assets scale with the annual revenue, then the sheet is split so that it balances
  // by construction rather than by adjustment.
  const totalAssets = annualRevenue.times(seed.assetsToRevenue);
  const shareholdersEquity = totalAssets.times(
    seed.equityToAssets * variation(params.periodIndex, 0.05, 1.1),
  );
  const totalLiabilities = totalAssets.minus(shareholdersEquity);
  const totalDebt = Decimal.min(shareholdersEquity.times(seed.debtToEquity), totalLiabilities);
  const currentAssets = totalAssets.times(CURRENT_ASSET_SHARE);
  const currentLiabilities = Decimal.min(
    currentAssets.dividedBy(seed.currentRatio),
    totalLiabilities,
  );
  const cash = currentAssets.times(CASH_SHARE_OF_CURRENT);
  const shares = new Decimal(seed.sharesMillions).times(scale).times(MILLION);

  const marginFactor = variation(params.periodIndex, 0.08, 0);
  const grossProfit = revenue.times(seed.grossMargin * variation(params.periodIndex, 0.04, 0.4));
  const operatingProfit = revenue.times(seed.operatingMargin * marginFactor);
  const netProfit = revenue.times(seed.netMargin * marginFactor);
  const capitalExpenditure = revenue.times(
    seed.capexToRevenue * variation(params.periodIndex, 0.18, 2.2),
  );
  const depreciation = capitalExpenditure.times(DEPRECIATION_TO_CAPEX);
  const ebitda = operatingProfit.plus(depreciation);
  const periodShare = params.periodType === 'annual' ? 1 : 0.25;
  const interestExpense = totalDebt.times(INTEREST_RATE).times(periodShare);
  const preTaxProfit = operatingProfit.minus(interestExpense);
  const taxExpense = preTaxProfit.isPositive() ? preTaxProfit.times(TAX_RATE) : new Decimal(0);

  const operatingCashFlow = params.forceNegativeFreeCashFlow
    ? // Burning cash: operations consume more than they bring in, whatever the reported profit.
      revenue.times(-0.02).minus(capitalExpenditure)
    : netProfit.plus(depreciation);
  const freeCashFlow = operatingCashFlow.minus(capitalExpenditure);
  const dividendsPaid = netProfit.isPositive()
    ? netProfit.times(seed.dividendPayout)
    : new Decimal(0);
  const netDebtRaised = freeCashFlow.isNegative()
    ? freeCashFlow.negated().times(0.6)
    : totalDebt.times(0.02).negated();

  // Money rounds to the currency's decimals, so earnings per share is computed from the rounded
  // figures a reader can actually add up.
  const roundedNet = new Decimal(netProfit.toFixed(decimals));
  const earningsPerShare = Number(roundedNet.dividedBy(shares).toFixed(2));

  return {
    instrumentId: params.instrumentId,
    periodType: params.periodType,
    basis,
    fiscalPeriod: params.fiscalPeriod,
    periodEnd: params.periodEnd,
    reportingCurrency: currency,
    isAudited: params.isAudited,
    isRestated: params.isRestated,
    restatementNote: params.restatementNote,
    publishedOn: params.publishedOn,
    balanceSheet: {
      totalAssets: money(totalAssets),
      currentAssets: money(currentAssets),
      cashAndEquivalents: money(cash),
      totalLiabilities: money(totalLiabilities),
      currentLiabilities: money(currentLiabilities),
      totalDebt: money(totalDebt),
      shareholdersEquity: money(shareholdersEquity),
      sharesOutstanding: shares.toNumber(),
    },
    income: {
      revenue: money(revenue),
      grossProfit: money(grossProfit),
      operatingProfit: money(operatingProfit),
      ebitda: money(ebitda),
      netProfit: money(roundedNet),
      interestExpense: money(interestExpense),
      taxExpense: money(taxExpense),
      earningsPerShare,
    },
    cashFlow: {
      operatingCashFlow: money(operatingCashFlow),
      capitalExpenditure: money(capitalExpenditure),
      freeCashFlow: money(freeCashFlow),
      dividendsPaid: money(dividendsPaid),
      netDebtRaised: money(netDebtRaised),
    },
  };
}
