// Reports (UI spec 7.16). Every report type shares one shape: headline metrics with optional previous
// period and benchmark values, an optional chart, tables and the assumptions behind the numbers.

import { z } from 'zod';

import { IsoDateSchema, IsoUtcTimestampSchema, MoneySchema } from './common';
import { BASE_CURRENCIES } from '../../shared/types/currency';

export const ReportTypeSchema = z.enum([
  'performance',
  'allocation',
  'costs',
  'income',
  'tax',
  'attribution',
]);
export type ReportTypeDto = z.infer<typeof ReportTypeSchema>;

export const ReportCurrencySchema = z.enum(BASE_CURRENCIES);
export type ReportCurrencyDto = z.infer<typeof ReportCurrencySchema>;

export const ReportComparisonSchema = z.enum(['none', 'previous', 'benchmark']);
export type ReportComparisonDto = z.infer<typeof ReportComparisonSchema>;

// A cell or metric value. Money stays a decimal-string amount; percentages are for display only.
export const ReportValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('money'), money: MoneySchema }),
  // Signed for changes such as returns (+2.10%); unsigned for shares and rates (40.96%).
  z.object({ kind: z.literal('percent'), value: z.number(), signed: z.boolean() }),
  z.object({ kind: z.literal('count'), value: z.number() }),
  z.object({ kind: z.literal('text'), value: z.string() }),
]);
export type ReportValueDto = z.infer<typeof ReportValueSchema>;

export const ReportMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: ReportValueSchema,
  previous: ReportValueSchema.nullable(),
  benchmark: ReportValueSchema.nullable(),
  // What the number means or how it was estimated.
  note: z.string().nullable(),
});
export type ReportMetricDto = z.infer<typeof ReportMetricSchema>;

export const ReportTableSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  columns: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      align: z.enum(['start', 'end']),
    }),
  ),
  rows: z.array(
    z.object({ id: z.string().min(1), cells: z.record(z.string(), ReportValueSchema) }),
  ),
  total: z.record(z.string(), ReportValueSchema).nullable(),
});
export type ReportTableDto = z.infer<typeof ReportTableSchema>;

export const ReportChartSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('comparison'),
    title: z.string().min(1),
    dates: z.array(IsoDateSchema),
    series: z.array(z.object({ name: z.string().min(1), values: z.array(z.number()) })),
    baseline: z.number(),
  }),
  z.object({
    kind: z.literal('donut'),
    title: z.string().min(1),
    items: z.array(z.object({ name: z.string().min(1), value: z.number().nonnegative() })),
  }),
]);
export type ReportChartDto = z.infer<typeof ReportChartSchema>;

export const ReportPeriodSchema = z.object({ from: IsoDateSchema, to: IsoDateSchema });

export const ReportSchema = z.object({
  type: ReportTypeSchema,
  title: z.string().min(1),
  period: ReportPeriodSchema,
  previousPeriod: ReportPeriodSchema.nullable(),
  benchmarkName: z.string().nullable(),
  currency: ReportCurrencySchema,
  generatedAt: IsoUtcTimestampSchema,
  metrics: z.array(ReportMetricSchema),
  chart: ReportChartSchema.nullable(),
  tables: z.array(ReportTableSchema),
  // Assumptions and limits, always shown with the report.
  notes: z.array(z.string().min(1)),
});
export type ReportDto = z.infer<typeof ReportSchema>;

export const ReportFrequencySchema = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);
export type ReportFrequencyDto = z.infer<typeof ReportFrequencySchema>;

export const ScheduledReportSchema = z.object({
  id: z.string().min(1),
  type: ReportTypeSchema,
  frequency: ReportFrequencySchema,
  currency: ReportCurrencySchema,
  channelId: z.string().min(1),
  enabled: z.boolean(),
  nextRunAt: IsoUtcTimestampSchema,
  lastRunAt: IsoUtcTimestampSchema.nullable(),
});
export type ScheduledReportDto = z.infer<typeof ScheduledReportSchema>;
export const ScheduledReportListSchema = z.array(ScheduledReportSchema);

export const CreateScheduledReportSchema = ScheduledReportSchema.pick({
  type: true,
  frequency: true,
  currency: true,
  channelId: true,
});
export type CreateScheduledReportDto = z.input<typeof CreateScheduledReportSchema>;

export const ReportRunSchema = z.object({
  id: z.string().min(1),
  scheduleId: z.string().nullable(),
  type: ReportTypeSchema,
  period: ReportPeriodSchema,
  currency: ReportCurrencySchema,
  channelId: z.string().min(1),
  generatedAt: IsoUtcTimestampSchema,
  status: z.enum(['delivered', 'failed']),
  detail: z.string().min(1),
});
export type ReportRunDto = z.infer<typeof ReportRunSchema>;
export const ReportRunListSchema = z.array(ReportRunSchema);
