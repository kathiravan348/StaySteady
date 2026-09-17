// Valuation and profitability measures (R-06; requirements 37).

import { Decimal } from 'decimal.js';

import type { Builder } from './measureContext';
import { money, percent, ratio, NO_PRICE } from './measureContext';

export const VALUATION_MEASURES: readonly Builder[] = [
  {
    id: 'price-to-earnings',
    label: 'Price to earnings',
    group: 'valuation',
    unit: 'times',
    compute: ({ latest, price }) => {
      if (price === null) return { value: null, inputs: NO_PRICE };
      const eps = new Decimal(latest.income.earningsPerShare);
      if (!eps.isPositive()) {
        return {
          value: null,
          inputs: `Earnings per share was ${eps.toFixed(2)} in ${latest.fiscalPeriod}: a price to earnings ratio on a loss says nothing.`,
        };
      }
      return {
        value: ratio(price, eps),
        inputs: `Price ${price.toFixed(2)} over earnings per share ${eps.toFixed(2)} (${latest.fiscalPeriod}).`,
      };
    },
  },
  {
    id: 'price-to-book',
    label: 'Price to book',
    group: 'valuation',
    unit: 'times',
    compute: ({ latest, price }) => {
      if (price === null) return { value: null, inputs: NO_PRICE };
      const bookPerShare = money(latest.balanceSheet.shareholdersEquity).dividedBy(
        latest.balanceSheet.sharesOutstanding,
      );
      return {
        value: ratio(price, bookPerShare),
        inputs: `Price ${price.toFixed(2)} over book value per share ${bookPerShare.toFixed(2)} (${latest.fiscalPeriod}).`,
      };
    },
  },
  {
    id: 'ev-to-ebitda',
    label: 'Enterprise value to EBITDA',
    group: 'valuation',
    unit: 'times',
    compute: ({ latest, marketCap }) => {
      if (marketCap === null) return { value: null, inputs: NO_PRICE };
      const enterprise = marketCap
        .plus(money(latest.balanceSheet.totalDebt))
        .minus(money(latest.balanceSheet.cashAndEquivalents));
      return {
        value: ratio(enterprise, money(latest.income.ebitda)),
        inputs: `Market value plus debt less cash, over EBITDA (${latest.fiscalPeriod}).`,
      };
    },
  },
  {
    id: 'price-to-sales',
    label: 'Price to sales',
    group: 'valuation',
    unit: 'times',
    compute: ({ latest, marketCap }) =>
      marketCap === null
        ? { value: null, inputs: NO_PRICE }
        : {
            value: ratio(marketCap, money(latest.income.revenue)),
            inputs: `Market value over revenue (${latest.fiscalPeriod}).`,
          },
  },
  {
    id: 'dividend-payout',
    label: 'Dividend payout',
    group: 'valuation',
    unit: 'percent',
    compute: ({ latest }) => {
      const paid = money(latest.cashFlow.dividendsPaid);
      const net = money(latest.income.netProfit);
      if (paid.isZero()) {
        return { value: 0, inputs: `No dividend was paid in ${latest.fiscalPeriod}.` };
      }
      return {
        value: percent(paid, net),
        inputs: `Dividends paid over net profit (${latest.fiscalPeriod}). Above 100% means the payout came from somewhere other than this year's profit.`,
      };
    },
  },
  {
    id: 'return-on-equity',
    label: 'Return on equity',
    group: 'profitability',
    unit: 'percent',
    compute: ({ latest }) => ({
      value: percent(money(latest.income.netProfit), money(latest.balanceSheet.shareholdersEquity)),
      inputs: `Net profit over shareholders equity (${latest.fiscalPeriod}).`,
    }),
  },
  {
    id: 'return-on-capital',
    label: 'Return on capital employed',
    group: 'profitability',
    unit: 'percent',
    compute: ({ latest }) => ({
      value: percent(
        money(latest.income.operatingProfit),
        money(latest.balanceSheet.shareholdersEquity).plus(money(latest.balanceSheet.totalDebt)),
      ),
      inputs: `Operating profit over equity plus debt (${latest.fiscalPeriod}).`,
    }),
  },
  {
    id: 'operating-margin',
    label: 'Operating margin',
    group: 'profitability',
    unit: 'percent',
    compute: ({ latest }) => ({
      value: percent(money(latest.income.operatingProfit), money(latest.income.revenue)),
      inputs: `Operating profit over revenue (${latest.fiscalPeriod}).`,
    }),
  },
  {
    id: 'net-margin',
    label: 'Net margin',
    group: 'profitability',
    unit: 'percent',
    compute: ({ latest }) => ({
      value: percent(money(latest.income.netProfit), money(latest.income.revenue)),
      inputs: `Net profit over revenue (${latest.fiscalPeriod}).`,
    }),
  },
];
