// Portfolio performance at a glance: every return here comes from the performance report builder, so a
// period on this screen and the report for the same dates always agree.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type { PortfolioPerformanceSchema, ReportCurrencyDto } from '../../schemas';
import type { ReportParts, ValueInput } from './reportParts';
import { NO_REFERENCES } from './reportParts';
import { performanceReport } from './reportPortfolioBuilders';
import type { ValuationContext } from './reportValuation';
import { addDays } from './reportValuation';

type Result = z.input<typeof PortfolioPerformanceSchema>;

const percentOf = (value: ValueInput | undefined): number | null =>
  value?.kind === 'percent' ? value.value : null;

const moneyAmount = (value: ValueInput | undefined): string =>
  value?.kind === 'money' ? value.money.amount : '0.00';

function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function endOfMonth(iso: string): string {
  const date = new Date(`${startOfMonth(iso)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return addDays(date.toISOString().slice(0, 10), -1);
}

export function buildPortfolioPerformance(
  v: ValuationContext,
  currency: ReportCurrencyDto,
  today: string,
): Result {
  const asOf = addDays(today, -1);
  const inception =
    v.holdings.flatMap((holding) => holding.lots.map((lot) => lot.purchaseDate)).sort()[0] ?? asOf;
  const run = (from: string, to: string): ReportParts =>
    performanceReport({
      v,
      refs: NO_REFERENCES,
      from: from < inception ? inception : from,
      to,
      currency,
      withBenchmark: false,
    });
  const metric = (report: ReportParts, id: string): ValueInput | undefined =>
    report.metrics.find((item) => item.id === id)?.value;

  const monthsBack = (months: number): string => {
    const date = new Date(`${asOf}T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - months);
    return addDays(date.toISOString().slice(0, 10), 1);
  };
  const periodDefs = [
    { id: '1m' as const, label: '1 month', from: monthsBack(1) },
    { id: '3m' as const, label: '3 months', from: monthsBack(3) },
    { id: 'ytd' as const, label: 'Year to date', from: `${asOf.slice(0, 4)}-01-01` },
    { id: '1y' as const, label: '1 year', from: monthsBack(12) },
    { id: 'all' as const, label: 'Since the first purchase', from: inception },
  ];
  const periods = periodDefs.map((period) => {
    const report = run(period.from, asOf);
    return {
      id: period.id,
      label: period.label,
      from: period.from < inception ? inception : period.from,
      to: asOf,
      returnPercent: percentOf(metric(report, 'twr')),
      gain: { amount: moneyAmount(metric(report, 'gain')), currency },
    };
  });

  const monthly: Result['monthly'] = [];
  for (let month = startOfMonth(inception); month <= asOf; month = addDays(endOfMonth(month), 1)) {
    const to = endOfMonth(month) > asOf ? asOf : endOfMonth(month);
    const value = percentOf(metric(run(month, to), 'twr'));
    if (value !== null) {
      monthly.push({
        year: Number(month.slice(0, 4)),
        month: Number(month.slice(5, 7)),
        returnPercent: value,
      });
    }
  }

  const series: Result['series'] = [];
  for (let date = inception; date <= asOf; date = addDays(date, 7)) {
    const total = v.holdings.reduce(
      (sum, holding) => sum.plus(v.holdingValue(holding, date, currency)),
      new Decimal(0),
    );
    series.push({ date, value: Number(total.toFixed(2)) });
  }
  const value = v.holdings.reduce(
    (sum, holding) => sum.plus(v.holdingValue(holding, asOf, currency)),
    new Decimal(0),
  );
  series.push({ date: asOf, value: Number(value.toFixed(2)) });

  // Contribution since the first purchase, from the report's by-holding table.
  const all = run(inception, asOf);
  const rows = all.tables[0]?.rows ?? [];
  const totalGain = rows.reduce(
    (sum, row) => sum.plus(moneyAmount(row.cells['gain'])),
    new Decimal(0),
  );
  const contributions = rows.map((row) => {
    const gain = new Decimal(moneyAmount(row.cells['gain']));
    const symbol = row.cells['instrument'];
    return {
      instrumentId: row.id,
      symbol: symbol?.kind === 'text' ? symbol.value : row.id,
      gain: { amount: gain.toFixed(2), currency },
      sharePercent: totalGain.isZero()
        ? null
        : Number(gain.dividedBy(totalGain.abs()).times(100).toFixed(1)),
    };
  });

  return {
    currency,
    asOf,
    inception,
    value: { amount: value.toFixed(2), currency },
    series,
    periods,
    monthly,
    contributions,
  };
}
