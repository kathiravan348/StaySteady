// Costs and income reports (UI spec 7.16); the tax summary is in reportTaxBuilder.ts. Costs and income come from the transaction
// record; tax rates, holding periods and dividend withholding come from the market configuration and
// are estimates for an India-resident owner, never advice.

import { Decimal } from 'decimal.js';

import type { MarketConfigInput, TransactionDto } from '../../schemas';
import type { BuildInput, ReportParts } from './reportParts';
import { column, countCell, dayOf, metric, moneyCell, percentCell, textCell } from './reportParts';

const ZERO = new Decimal(0);

const inPeriod = (input: BuildInput, tx: TransactionDto): boolean =>
  dayOf(tx.timestamp) >= input.from && dayOf(tx.timestamp) <= input.to;

const converted = (
  input: BuildInput,
  amount: { amount: string; currency: string },
  date: string,
): Decimal =>
  new Decimal(amount.amount).abs().times(input.v.fx(amount.currency, input.currency, date));

const symbolOf = (input: BuildInput, instrumentId: string | undefined): string =>
  instrumentId === undefined
    ? 'Account'
    : (input.v.instrument(instrumentId)?.symbol ?? instrumentId);

export function marketFor(input: BuildInput, instrumentId: string): MarketConfigInput | undefined {
  const instrument = input.v.instrument(instrumentId);
  return input.v.markets.find((market) => market.marketId === String(instrument?.marketId));
}

export function costsReport(input: BuildInput): ReportParts {
  const { currency } = input;
  const byInstrument = new Map<string, { commission: Decimal; conversion: Decimal }>();
  let bought = ZERO;
  input.v.transactions
    .filter((tx) => inPeriod(input, tx))
    .forEach((tx) => {
      const key = tx.instrumentId === undefined ? 'account' : String(tx.instrumentId);
      const current = byInstrument.get(key) ?? { commission: ZERO, conversion: ZERO };
      const date = dayOf(tx.timestamp);
      if (tx.type === 'buy') {
        bought = bought.plus(converted(input, tx.netAmount, date));
        byInstrument.set(key, {
          ...current,
          commission: current.commission.plus(converted(input, tx.fees, date)),
        });
      } else if (tx.type === 'fee') {
        byInstrument.set(key, {
          ...current,
          conversion: current.conversion.plus(converted(input, tx.netAmount, date)),
        });
      }
    });
  const rows = [...byInstrument.entries()].filter(
    ([, row]) => !row.commission.plus(row.conversion).isZero(),
  );
  const commission = rows.reduce((sum, [, row]) => sum.plus(row.commission), ZERO);
  const conversion = rows.reduce((sum, [, row]) => sum.plus(row.conversion), ZERO);
  const total = commission.plus(conversion);

  return {
    title: 'Costs',
    metrics: [
      metric('total', 'Total costs', moneyCell(total, currency)),
      metric('commission', 'Commissions', moneyCell(commission, currency)),
      metric(
        'conversion',
        'Currency conversion charges',
        moneyCell(conversion, currency),
        '0.25% on purchases outside the USD funding currency.',
      ),
      metric(
        'share',
        'Costs as share of purchases',
        bought.isZero()
          ? textCell('No purchases')
          : percentCell(total.dividedBy(bought).times(100)),
      ),
    ],
    chart: null,
    tables: [
      {
        id: 'instruments',
        title: 'By instrument',
        columns: [
          column('instrument', 'Instrument', 'start'),
          column('commission', 'Commissions'),
          column('conversion', 'Conversion'),
          column('total', 'Total'),
        ],
        rows: rows.map(([key, row]) => ({
          id: key,
          cells: {
            instrument: textCell(symbolOf(input, key === 'account' ? undefined : key)),
            commission: moneyCell(row.commission, currency),
            conversion: moneyCell(row.conversion, currency),
            total: moneyCell(row.commission.plus(row.conversion), currency),
          },
        })),
        total: {
          instrument: textCell('Total'),
          commission: moneyCell(commission, currency),
          conversion: moneyCell(conversion, currency),
          total: moneyCell(total, currency),
        },
      },
    ],
    notes: [
      'Each cost is converted at the exchange rate on the day it was charged.',
      'Spread and slippage are not charges and are not included.',
    ],
  };
}

interface DividendRow {
  readonly id: string;
  readonly symbol: string;
  readonly gross: Decimal;
  readonly withheld: Decimal;
  readonly rate: number;
}

export function dividends(input: BuildInput): readonly DividendRow[] {
  return input.v.transactions
    .filter((tx) => tx.type === 'dividend' && inPeriod(input, tx) && tx.instrumentId !== undefined)
    .map((tx) => {
      const id = String(tx.instrumentId);
      const gross = converted(input, tx.netAmount, dayOf(tx.timestamp));
      const rate = marketFor(input, id)?.tax.dividendWithholdingPercent ?? 0;
      return {
        id: tx.id,
        symbol: symbolOf(input, id),
        gross,
        withheld: gross.times(rate).dividedBy(100),
        rate,
      };
    });
}

export function incomeReport(input: BuildInput): ReportParts {
  const { currency, v, from, to } = input;
  const rows = dividends(input);
  const gross = rows.reduce((sum, row) => sum.plus(row.gross), ZERO);
  const withheld = rows.reduce((sum, row) => sum.plus(row.withheld), ZERO);
  const average = v.holdings
    .reduce(
      (sum, holding) =>
        sum
          .plus(v.holdingValue(holding, from, currency))
          .plus(v.holdingValue(holding, to, currency)),
      ZERO,
    )
    .dividedBy(2);

  return {
    title: 'Income',
    metrics: [
      metric('gross', 'Dividends received', moneyCell(gross, currency)),
      metric(
        'withheld',
        'Tax withheld (estimated)',
        moneyCell(withheld, currency),
        'Withholding rates from each market’s configuration.',
      ),
      metric('net', 'Net income', moneyCell(gross.minus(withheld), currency)),
      metric('payments', 'Payments', countCell(rows.length)),
      metric(
        'yield',
        'Income yield for the period',
        average.isZero() ? textCell('—') : percentCell(gross.dividedBy(average).times(100)),
        'Dividends against the average of start and end value; not annualised.',
      ),
    ],
    chart: null,
    tables: [
      {
        id: 'payments',
        title: 'Dividend payments',
        columns: [
          column('instrument', 'Instrument', 'start'),
          column('gross', 'Gross'),
          column('rate', 'Withholding'),
          column('withheld', 'Withheld'),
          column('net', 'Net'),
        ],
        rows: rows.map((row) => ({
          id: row.id,
          cells: {
            instrument: textCell(row.symbol),
            gross: moneyCell(row.gross, currency),
            rate: percentCell(row.rate),
            withheld: moneyCell(row.withheld, currency),
            net: moneyCell(row.gross.minus(row.withheld), currency),
          },
        })),
        total:
          rows.length === 0
            ? null
            : {
                instrument: textCell('Total'),
                gross: moneyCell(gross, currency),
                rate: textCell(''),
                withheld: moneyCell(withheld, currency),
                net: moneyCell(gross.minus(withheld), currency),
              },
      },
    ],
    notes: [
      'Withholding is estimated from configured rates; the broker statement is the record.',
      'Income from interest and funds is not tracked yet.',
    ],
  };
}
