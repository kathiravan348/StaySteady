// Warning flags over reported statements (R-06; requirements 37; decision 52). Each flag is an
// observation with the evidence that raised it — never advice, never a recommendation, and never a
// score that hides what it was made of.

import { Decimal } from 'decimal.js';

import type { FinancialStatementDto } from '../../data/schemas/financial-statements';
import type { FundamentalFlag } from './measureTypes';

const money = (value: { readonly amount: string }): Decimal => new Decimal(value.amount);
const billions = (value: Decimal): string => `${value.dividedBy(1e9).toFixed(1)}bn`;

export interface FlagRequest {
  // Annual statements on one basis, newest first.
  readonly annual: readonly FinancialStatementDto[];
  // Promoter pledge as a share of the promoter holding, oldest first, where it is reported.
  readonly pledgeTrend?: readonly number[];
}

export function fundamentalFlags(request: FlagRequest): FundamentalFlag[] {
  const flags: FundamentalFlag[] = [];
  const [latest, previous] = request.annual;
  if (latest === undefined) return flags;

  // Debt rising while profit falls: either one alone is ordinary, together they are not.
  if (previous !== undefined) {
    const debtNow = money(latest.balanceSheet.totalDebt);
    const debtBefore = money(previous.balanceSheet.totalDebt);
    const profitNow = money(latest.income.netProfit);
    const profitBefore = money(previous.income.netProfit);
    if (debtNow.greaterThan(debtBefore) && profitNow.lessThan(profitBefore)) {
      flags.push({
        id: 'debt-up-profit-down',
        severity: 'warning',
        title: 'Debt rose while profit fell',
        evidence: `Debt ${billions(debtBefore)} to ${billions(debtNow)} and net profit ${billions(profitBefore)} to ${billions(profitNow)} between ${previous.fiscalPeriod} and ${latest.fiscalPeriod}.`,
      });
    }
  }

  const negativeYears = request.annual.filter((statement) =>
    money(statement.cashFlow.freeCashFlow).isNegative(),
  );
  if (negativeYears.length >= 3) {
    flags.push({
      id: 'negative-free-cash-flow',
      severity: 'critical',
      title: `Free cash flow negative in ${String(negativeYears.length)} of the last ${String(request.annual.length)} years`,
      evidence: `${negativeYears
        .slice(0, 3)
        .map(
          (statement) =>
            `${statement.fiscalPeriod} ${billions(money(statement.cashFlow.freeCashFlow))}`,
        )
        .join(', ')}. The business has been funded from somewhere other than its own operations.`,
    });
  }

  const dividends = money(latest.cashFlow.dividendsPaid);
  const netProfit = money(latest.income.netProfit);
  if (dividends.isPositive() && netProfit.isPositive() && dividends.greaterThan(netProfit)) {
    flags.push({
      id: 'payout-above-earnings',
      severity: 'warning',
      title: 'Dividend paid out more than the year earned',
      evidence: `Dividends ${billions(dividends)} against net profit ${billions(netProfit)} in ${latest.fiscalPeriod}.`,
    });
  }

  const interest = money(latest.income.interestExpense);
  const operating = money(latest.income.operatingProfit);
  // Only meaningful when there is a profit to do the covering: a loss has its own flag below.
  if (
    interest.isPositive() &&
    operating.isPositive() &&
    operating.dividedBy(interest).lessThan(2.5)
  ) {
    flags.push({
      id: 'thin-interest-cover',
      severity: 'warning',
      title: 'Operating profit barely covers interest',
      evidence: `Operating profit ${billions(operating)} against interest ${billions(interest)} in ${latest.fiscalPeriod}: ${operating.dividedBy(interest).toFixed(1)} times cover.`,
    });
  }

  if (money(latest.income.netProfit).isNegative()) {
    flags.push({
      id: 'loss-making',
      severity: 'warning',
      title: 'Loss-making in the latest reported year',
      evidence: `Net loss of ${billions(money(latest.income.netProfit).negated())} on revenue of ${billions(money(latest.income.revenue))} in ${latest.fiscalPeriod}.`,
    });
  }

  const restated = request.annual.find((statement) => statement.isRestated);
  if (restated !== undefined) {
    flags.push({
      id: 'restated-figures',
      severity: 'warning',
      title: `${restated.fiscalPeriod} was restated after publication`,
      evidence: restated.restatementNote ?? 'The company reissued this year after publishing it.',
    });
  }

  const auditIssue = request.annual.find(
    (statement) => statement.periodType === 'annual' && !statement.isAudited,
  );
  if (auditIssue !== undefined) {
    flags.push({
      id: 'unaudited-annual',
      severity: 'critical',
      title: `${auditIssue.fiscalPeriod} is not audited`,
      evidence: 'An annual statement without an audit opinion behind it cannot be relied on.',
    });
  }

  const pledge = request.pledgeTrend ?? [];
  const firstPledge = pledge[0];
  const lastPledge = pledge[pledge.length - 1];
  if (
    firstPledge !== undefined &&
    lastPledge !== undefined &&
    lastPledge > firstPledge &&
    lastPledge >= 5
  ) {
    flags.push({
      id: 'pledge-rising',
      severity: 'warning',
      title: 'Promoter pledge is rising',
      evidence: `${firstPledge.toFixed(1)}% of the promoter holding pledged eight quarters ago, ${lastPledge.toFixed(1)}% now. Pledged shares can be sold by the lender, not the promoter.`,
    });
  }

  return flags;
}
