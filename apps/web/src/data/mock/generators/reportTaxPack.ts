// The year-end pack on the tax report for the residence country (E-06; requirements 26; decision 45):
// income by source country with withholding and foreign tax credit, losses carried forward, foreign
// holdings for the annual disclosure, and money sent abroad against the yearly cap. Planning figures,
// never a filing.

import { Decimal } from 'decimal.js';

import { converted, inPeriod } from './reportCashBuilders';
import type { BuildInput, MetricInput, TableInput } from './reportParts';
import { column, dayOf, metric, moneyCell, percentCell, textCell } from './reportParts';

const ZERO = new Decimal(0);

export interface TaxPack {
  readonly metrics: MetricInput[];
  readonly tables: TableInput[];
  readonly notes: string[];
}

function taxYearStart(input: BuildInput, date: string): string {
  const start = input.v.taxRules?.taxYearStart ?? { month: 1, day: 1 };
  const year = Number(date.slice(0, 4));
  const candidate = `${String(year)}-${String(start.month).padStart(2, '0')}-${String(start.day).padStart(2, '0')}`;
  return candidate <= date ? candidate : `${String(year - 1)}${candidate.slice(4)}`;
}

function incomeTable(input: BuildInput): TableInput {
  const { v, currency } = input;
  const rules = v.taxRules;
  const byCountry = new Map<string, { gross: Decimal; withheld: Decimal; rate: number }>();
  v.transactions
    .filter((tx) => tx.type === 'dividend' && tx.instrumentId !== undefined && inPeriod(input, tx))
    .forEach((tx) => {
      const marketId = String(v.instrument(String(tx.instrumentId))?.marketId ?? 'unknown');
      const rate =
        v.markets.find((market) => market.marketId === marketId)?.tax.dividendWithholdingPercent ??
        0;
      const gross = converted(input, tx.netAmount, dayOf(tx.timestamp));
      const current = byCountry.get(marketId) ?? { gross: ZERO, withheld: ZERO, rate };
      byCountry.set(marketId, {
        gross: current.gross.plus(gross),
        withheld: current.withheld.plus(gross.times(rate).dividedBy(100)),
        rate,
      });
    });
  const rows = [...byCountry.entries()].map(([country, row]) => {
    const isForeign = rules !== null && country !== rules.country;
    const credit = isForeign && rules.foreignAssets.foreignTaxCreditClaimable ? row.withheld : ZERO;
    return {
      id: `income-${country}`,
      cells: {
        country: textCell(country),
        gross: moneyCell(row.gross, currency),
        rate: percentCell(row.rate),
        withheld: moneyCell(row.withheld, currency),
        credit: moneyCell(credit, currency),
      },
    };
  });
  return {
    id: 'income',
    title: 'Dividends by source country',
    columns: [
      column('country', 'Source', 'start'),
      column('gross', 'Gross dividends'),
      column('rate', 'Withholding rate'),
      column('withheld', 'Withheld at source'),
      column('credit', 'Foreign tax credit'),
    ],
    rows,
    total: null,
  };
}

function lossesTable(input: BuildInput): TableInput {
  return {
    id: 'losses',
    title: 'Losses carried forward',
    columns: [
      column('year', 'Tax year of loss', 'start'),
      column('category', 'Category', 'start'),
      column('original', 'Original loss'),
      column('setOff', 'Set off so far'),
      column('remaining', 'Carried forward'),
      column('expiry', 'Last year usable', 'start'),
    ],
    rows: input.refs.losses.map((loss) => {
      const rate = input.v.fx(loss.remaining.currency, input.currency, input.to);
      return {
        id: loss.id,
        cells: {
          year: textCell(loss.taxYear),
          category: textCell(loss.category === 'short_term' ? 'Short term' : 'Long term'),
          original: moneyCell(new Decimal(loss.original.amount).times(rate), input.currency),
          setOff: moneyCell(new Decimal(loss.setOff.amount).times(rate), input.currency),
          remaining: moneyCell(new Decimal(loss.remaining.amount).times(rate), input.currency),
          expiry: textCell(
            loss.lastTaxYear === null
              ? 'Never expires'
              : `${loss.lastTaxYear}${loss.isExpiringSoon ? ' (expiring soon)' : ''}`,
          ),
        },
      };
    }),
    total: null,
  };
}

function foreignHoldingsTable(input: BuildInput): { table: TableInput; remitted: Decimal } {
  const { v, currency, to } = input;
  const rules = v.taxRules;
  const yearStart = taxYearStart(input, to);
  const capCurrency = rules?.foreignAssets.remittanceCapPerYear?.currency ?? currency;
  let remitted = ZERO;
  const rows = v.holdings.flatMap((holding) => {
    const instrument = v.instrument(String(holding.instrumentId));
    if (
      instrument === undefined ||
      rules === null ||
      String(instrument.marketId) === rules.country
    ) {
      return [];
    }
    const firstBought = holding.lots.map((lot) => lot.purchaseDate).sort()[0] ?? '';
    const cost = holding.lots.reduce(
      (sum, lot) =>
        sum.plus(
          new Decimal(lot.quantity)
            .times(lot.costPerUnit.amount)
            .times(v.fx(instrument.currency, currency, lot.purchaseDate)),
        ),
      ZERO,
    );
    remitted = holding.lots
      .filter((lot) => lot.purchaseDate >= yearStart && lot.purchaseDate <= to)
      .reduce(
        (sum, lot) =>
          sum.plus(
            new Decimal(lot.quantity)
              .times(lot.costPerUnit.amount)
              .times(v.fx(instrument.currency, capCurrency, lot.purchaseDate)),
          ),
        remitted,
      );
    return [
      {
        id: `foreign-${String(holding.instrumentId)}`,
        cells: {
          instrument: textCell(instrument.symbol),
          country: textCell(String(instrument.marketId)),
          acquired: textCell(firstBought),
          cost: moneyCell(cost, currency),
          value: moneyCell(v.holdingValue(holding, to, currency), currency),
        },
      },
    ];
  });
  return {
    table: {
      id: 'foreign',
      title: 'Foreign holdings for the annual disclosure',
      columns: [
        column('instrument', 'Instrument', 'start'),
        column('country', 'Country', 'start'),
        column('acquired', 'First acquired', 'start'),
        column('cost', 'Cost at purchase rates'),
        column('value', 'Value at period end'),
      ],
      rows,
      total: null,
    },
    remitted,
  };
}

export function taxPack(input: BuildInput): TaxPack {
  const rules = input.v.taxRules;
  if (rules === null) {
    return {
      metrics: [],
      tables: [],
      notes: ['No residence tax rules, so no tax pack is prepared.'],
    };
  }
  const foreign = foreignHoldingsTable(input);
  const cap = rules.foreignAssets.remittanceCapPerYear;
  const metrics =
    cap === null
      ? []
      : [
          metric(
            'remitted',
            'Money sent abroad this tax year',
            {
              kind: 'money',
              money: { amount: foreign.remitted.toFixed(2), currency: cap.currency },
            },
            `Foreign purchases since ${taxYearStart(input, input.to)} against a yearly cap of ${cap.amount} ${cap.currency} (${foreign.remitted.dividedBy(cap.amount).times(100).toFixed(1)}% used).`,
          ),
        ];
  return {
    metrics,
    tables: [incomeTable(input), lossesTable(input), foreign.table],
    notes: [
      `Tax year from ${String(rules.taxYearStart.day)}/${String(rules.taxYearStart.month)}; choose that span as the period for a year-end pack.`,
      rules.foreignAssets.annualDisclosureRequired
        ? 'Foreign holdings must be disclosed every year, whether or not anything was sold.'
        : 'No annual foreign asset disclosure is configured.',
    ],
  };
}
