// Real returns and the drag of costs and tax on the performance report (E-06; requirements 30, 31).
// Inflation for the report currency's country comes from the recorded monthly index, or from the
// saved assumption where the owner chose it or no figure exists.

import { Decimal } from 'decimal.js';

import type { ReportCurrencyDto } from '../../schemas';
import { costsReport } from './reportCashBuilders';
import type { BuildInput, MetricInput, ReportParts, ValueInput } from './reportParts';
import { metric, percentCell, textCell } from './reportParts';
import { taxReport } from './reportTaxBuilder';
import { daysBetween } from './reportValuation';

const COUNTRY_BY_CURRENCY: Readonly<Partial<Record<ReportCurrencyDto, 'US' | 'IN' | 'GB'>>> = {
  USD: 'US',
  INR: 'IN',
  GBP: 'GB',
};

interface InflationOverPeriod {
  readonly factor: Decimal;
  readonly source: string;
}

function inflationOver(input: BuildInput): InflationOverPeriod | null {
  const country = COUNTRY_BY_CURRENCY[input.currency];
  if (country === undefined) return null;
  const { inflation, inflationAssumptions } = input.refs;
  const assumption = inflationAssumptions.find((item) => item.country === country);
  const series = inflation.find((item) => item.country === country);
  const start = series?.monthlyIndex.find((point) => point.month === input.from.slice(0, 7));
  const end = series?.monthlyIndex.find((point) => point.month === input.to.slice(0, 7));
  if ((assumption?.useRecordedHistory ?? true) && start !== undefined && end !== undefined) {
    return {
      factor: new Decimal(end.index).dividedBy(start.index),
      source: `recorded ${country} inflation`,
    };
  }
  if (assumption === undefined) return null;
  const years = new Decimal(daysBetween(input.from, input.to)).dividedBy(365);
  return {
    factor: new Decimal(1)
      .plus(new Decimal(assumption.assumedAnnualPercent).dividedBy(100))
      .pow(years),
    source: `the assumed ${assumption.assumedAnnualPercent.toFixed(1)}% a year for ${country}`,
  };
}

const percentOf = (value: ValueInput | null | undefined): Decimal | null =>
  value !== null && value !== undefined && value.kind === 'percent'
    ? new Decimal(value.value)
    : null;
const moneyOf = (value: ValueInput | undefined): Decimal | null =>
  value !== undefined && value.kind === 'money' ? new Decimal(value.money.amount) : null;

const deflate = (nominalPercent: Decimal, factor: Decimal): Decimal =>
  nominalPercent.dividedBy(100).plus(1).dividedBy(factor).minus(1).times(100);

export function realReturnMetrics(input: BuildInput, parts: ReportParts): MetricInput[] {
  const twr = parts.metrics.find((item) => item.id === 'twr');
  const nominal = percentOf(twr?.value);
  const inflation = inflationOver(input);
  const real =
    nominal === null || inflation === null
      ? metric(
          'real',
          'Real return',
          textCell('No inflation figures'),
          `No inflation series or assumption for ${input.currency}.`,
        )
      : {
          ...metric(
            'real',
            'Real return (after inflation)',
            percentCell(deflate(nominal, inflation.factor), true),
            `Time-weighted return less ${inflation.factor.minus(1).times(100).toFixed(2)}% inflation over the period, using ${inflation.source}.`,
          ),
          benchmark: (() => {
            const benchmark = percentOf(twr?.benchmark);
            return benchmark === null
              ? null
              : percentCell(deflate(benchmark, inflation.factor), true);
          })(),
        };

  const costs = moneyOf(costsReport(input).metrics.find((item) => item.id === 'total')?.value);
  const tax = moneyOf(taxReport(input).metrics.find((item) => item.id === 'estimate')?.value);
  const gain = moneyOf(parts.metrics.find((item) => item.id === 'gain')?.value);
  const gross = gain === null || costs === null ? null : gain.plus(costs);
  const drag =
    gross === null || costs === null || tax === null || gross.lte(0)
      ? metric(
          'drag',
          'Costs and tax as share of gross gain',
          textCell('No gross gain in the period'),
        )
      : metric(
          'drag',
          'Costs and tax as share of gross gain',
          percentCell(costs.plus(tax).dividedBy(gross).times(100)),
          'Commissions and conversion charges in the period plus the tax estimated if every holding were sold at the end, against the gain before costs.',
        );
  return [real, drag];
}
