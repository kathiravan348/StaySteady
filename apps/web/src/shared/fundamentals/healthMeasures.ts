// Financial health, growth and cash-quality measures (R-06; requirements 37).

import { Decimal } from 'decimal.js';

import type { Builder } from './measureContext';
import { growth, money, percent, ratio } from './measureContext';

export const HEALTH_MEASURES: readonly Builder[] = [
  {
    id: 'debt-to-equity',
    label: 'Debt to equity',
    group: 'health',
    unit: 'number',
    compute: ({ latest }) => ({
      value: ratio(
        money(latest.balanceSheet.totalDebt),
        money(latest.balanceSheet.shareholdersEquity),
      ),
      inputs: `Total debt over shareholders equity (${latest.fiscalPeriod}).`,
    }),
  },
  {
    id: 'net-debt-to-ebitda',
    label: 'Net debt to EBITDA',
    group: 'health',
    unit: 'times',
    compute: ({ latest }) => {
      const netDebt = money(latest.balanceSheet.totalDebt).minus(
        money(latest.balanceSheet.cashAndEquivalents),
      );
      if (!netDebt.isPositive()) {
        return {
          value: 0,
          inputs: `Cash exceeded debt in ${latest.fiscalPeriod}, so there is no net debt to service.`,
        };
      }
      return {
        value: ratio(netDebt, money(latest.income.ebitda)),
        inputs: `Debt less cash, over EBITDA (${latest.fiscalPeriod}). Years of earnings it would take to repay.`,
      };
    },
  },
  {
    id: 'current-ratio',
    label: 'Current ratio',
    group: 'health',
    unit: 'number',
    compute: ({ latest }) => ({
      value: ratio(
        money(latest.balanceSheet.currentAssets),
        money(latest.balanceSheet.currentLiabilities),
      ),
      inputs: `Current assets over current liabilities (${latest.fiscalPeriod}). Below 1 means short-term bills exceed short-term assets.`,
    }),
  },
  {
    id: 'interest-cover',
    label: 'Interest cover',
    group: 'health',
    unit: 'times',
    compute: ({ latest }) => {
      const interest = money(latest.income.interestExpense);
      if (interest.isZero()) {
        return {
          value: null,
          inputs: `No interest was paid in ${latest.fiscalPeriod}, so there is nothing to cover.`,
        };
      }
      return {
        value: ratio(money(latest.income.operatingProfit), interest),
        inputs: `Operating profit over interest paid (${latest.fiscalPeriod}).`,
      };
    },
  },
  {
    id: 'revenue-growth-3y',
    label: 'Revenue growth, 3 years',
    group: 'growth',
    unit: 'percent',
    compute: (context) => growth(context, 3, (s) => money(s.income.revenue)),
  },
  {
    id: 'revenue-growth-5y',
    label: 'Revenue growth, 5 years',
    group: 'growth',
    unit: 'percent',
    compute: (context) => growth(context, 4, (s) => money(s.income.revenue)),
  },
  {
    id: 'eps-growth-3y',
    label: 'Earnings per share growth, 3 years',
    group: 'growth',
    unit: 'percent',
    compute: (context) => growth(context, 3, (s) => new Decimal(s.income.earningsPerShare)),
  },
  {
    id: 'quarter-revenue-growth',
    label: 'Latest quarter against the same quarter a year earlier',
    group: 'growth',
    unit: 'percent',
    compute: ({ quarterly }) => {
      const latest = quarterly[0];
      const yearAgo = quarterly[4];
      if (latest === undefined || yearAgo === undefined) {
        return { value: null, inputs: 'Needs five reported quarters; fewer are available.' };
      }
      const from = money(yearAgo.income.revenue);
      const to = money(latest.income.revenue);
      return {
        value: from.isZero() ? null : Number(to.dividedBy(from).minus(1).times(100).toFixed(2)),
        inputs: `${latest.fiscalPeriod} against ${yearAgo.fiscalPeriod}, which removes the seasonal pattern.`,
      };
    },
  },
  {
    id: 'cash-conversion',
    label: 'Free cash flow against net profit',
    group: 'cash',
    unit: 'percent',
    compute: ({ latest }) => {
      const net = money(latest.income.netProfit);
      if (!net.isPositive()) {
        return {
          value: null,
          inputs: `${latest.fiscalPeriod} was a loss, so there is no profit to convert into cash.`,
        };
      }
      return {
        value: percent(money(latest.cashFlow.freeCashFlow), net),
        inputs: `Free cash flow over net profit (${latest.fiscalPeriod}). Well under 100% for years means reported profit is not arriving as cash.`,
      };
    },
  },
];
