// Assembles a report (UI spec 7.16): runs the type's builder for the period, and again for the
// previous period of equal length when asked, attaching those values to the matching metrics.

import type { z } from 'zod';

import type {
  ReportComparisonDto,
  ReportCurrencyDto,
  ReportRunSchema,
  ReportSchema,
  ReportTypeDto,
  ScheduledReportSchema,
} from '../../schemas';
import { attributionReport } from './reportAttribution';
import { costsReport, incomeReport } from './reportCashBuilders';
import type { BuildInput, ReportParts } from './reportParts';
import { BENCHMARK_NAME, allocationReport, performanceReport } from './reportPortfolioBuilders';
import { taxReport } from './reportTaxBuilder';
import type { ValuationContext } from './reportValuation';
import { addDays, daysBetween } from './reportValuation';

const BUILDERS: Readonly<Record<ReportTypeDto, (input: BuildInput) => ReportParts>> = {
  performance: performanceReport,
  allocation: allocationReport,
  costs: costsReport,
  income: incomeReport,
  tax: taxReport,
  attribution: attributionReport,
};

export interface ReportRequest {
  readonly type: ReportTypeDto;
  readonly from: string;
  readonly to: string;
  readonly currency: ReportCurrencyDto;
  readonly comparison: ReportComparisonDto;
}

export function buildReport(
  request: ReportRequest,
  v: ValuationContext,
  generatedAt: string,
): z.input<typeof ReportSchema> {
  const { type, from, to, currency, comparison } = request;
  const withBenchmark = comparison === 'benchmark' && type === 'performance';
  const parts = BUILDERS[type]({ v, from, to, currency, withBenchmark });

  const length = daysBetween(from, to) + 1;
  const previousPeriod =
    comparison === 'previous' ? { from: addDays(from, -length), to: addDays(from, -1) } : null;
  const previous =
    previousPeriod === null
      ? null
      : BUILDERS[type]({
          v,
          from: previousPeriod.from,
          to: previousPeriod.to,
          currency,
          withBenchmark: false,
        });
  const metrics =
    previous === null
      ? parts.metrics
      : parts.metrics.map((item) => ({
          ...item,
          previous: previous.metrics.find((old) => old.id === item.id)?.value ?? null,
        }));

  const notes = [...parts.notes];
  if (comparison === 'benchmark' && type !== 'performance') {
    notes.unshift('A benchmark comparison applies to the performance report only.');
  }
  return {
    type,
    title: parts.title,
    period: { from, to },
    previousPeriod,
    benchmarkName: withBenchmark ? BENCHMARK_NAME : null,
    currency,
    generatedAt,
    metrics,
    chart: parts.chart,
    tables: parts.tables,
    notes,
  };
}

type Schedule = z.input<typeof ScheduledReportSchema>;
type Run = z.input<typeof ReportRunSchema>;

const at = (iso: string): string => `${iso}T06:00:00.000Z`;

// The next time a schedule runs after `today`: Mondays, the 1st of a month, quarter or year.
export function nextRunDate(frequency: Schedule['frequency'], today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  if (frequency === 'weekly') {
    const days = (8 - date.getUTCDay()) % 7 || 7;
    return at(addDays(today, days));
  }
  const month = date.getUTCMonth();
  const step =
    frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 - (month % 3) : 12 - month;
  const next = new Date(Date.UTC(date.getUTCFullYear(), month + step, 1));
  return at(next.toISOString().slice(0, 10));
}

// The last complete period a schedule reports on, ending the day before `today`.
export function lastCompletePeriod(
  frequency: Schedule['frequency'],
  today: string,
): { from: string; to: string } {
  const to = addDays(today, -1);
  const days = { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 }[frequency];
  return { from: addDays(to, -(days - 1)), to };
}

export function seedReportSchedules(today: string): Schedule[] {
  return [
    {
      id: 'sch-performance-monthly',
      type: 'performance',
      frequency: 'monthly',
      currency: 'USD',
      channelId: 'ch-email',
      enabled: true,
      nextRunAt: nextRunDate('monthly', today),
      lastRunAt: '2026-09-01T06:00:00.000Z',
    },
    {
      id: 'sch-tax-quarterly',
      type: 'tax',
      frequency: 'quarterly',
      currency: 'INR',
      channelId: 'ch-email',
      enabled: true,
      nextRunAt: nextRunDate('quarterly', today),
      lastRunAt: '2026-07-01T06:00:00.000Z',
    },
    // Disabled after its webhook deliveries kept failing (the same endpoint fails on System Health).
    {
      id: 'sch-costs-weekly',
      type: 'costs',
      frequency: 'weekly',
      currency: 'USD',
      channelId: 'ch-webhook',
      enabled: false,
      nextRunAt: nextRunDate('weekly', today),
      lastRunAt: '2026-09-14T06:00:00.000Z',
    },
  ];
}

export function seedReportRuns(): Run[] {
  const run = (
    id: string,
    scheduleId: string,
    type: Run['type'],
    from: string,
    to: string,
    currency: Run['currency'],
    channelId: string,
    generatedAt: string,
    status: Run['status'],
    detail: string,
  ): Run => ({
    id,
    scheduleId,
    type,
    period: { from, to },
    currency,
    channelId,
    generatedAt,
    status,
    detail,
  });
  return [
    run(
      'run-006',
      'sch-costs-weekly',
      'costs',
      '2026-09-07',
      '2026-09-13',
      'USD',
      'ch-webhook',
      '2026-09-14T06:00:00.000Z',
      'failed',
      'Endpoint returned 502 Bad Gateway',
    ),
    run(
      'run-005',
      'sch-costs-weekly',
      'costs',
      '2026-08-31',
      '2026-09-06',
      'USD',
      'ch-webhook',
      '2026-09-07T06:00:00.000Z',
      'failed',
      'Endpoint returned 502 Bad Gateway',
    ),
    run(
      'run-004',
      'sch-performance-monthly',
      'performance',
      '2026-08-01',
      '2026-08-31',
      'USD',
      'ch-email',
      '2026-09-01T06:00:00.000Z',
      'delivered',
      'Delivered in 2.1 s',
    ),
    run(
      'run-003',
      'sch-performance-monthly',
      'performance',
      '2026-07-01',
      '2026-07-31',
      'USD',
      'ch-email',
      '2026-08-01T06:00:00.000Z',
      'delivered',
      'Delivered in 1.8 s',
    ),
    run(
      'run-002',
      'sch-tax-quarterly',
      'tax',
      '2026-04-01',
      '2026-06-30',
      'INR',
      'ch-email',
      '2026-07-01T06:00:00.000Z',
      'delivered',
      'Delivered in 2.4 s',
    ),
    run(
      'run-001',
      'sch-performance-monthly',
      'performance',
      '2026-06-01',
      '2026-06-30',
      'USD',
      'ch-email',
      '2026-07-01T06:00:00.000Z',
      'delivered',
      'Delivered in 1.9 s',
    ),
  ];
}
