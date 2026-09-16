// Building blocks shared by the report builders (UI spec 7.16): value cells and the parts a builder
// returns before the report is assembled.

import type { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  ReportChartSchema,
  ReportCurrencyDto,
  ReportMetricSchema,
  ReportTableSchema,
  ReportValueSchema,
} from '../../schemas';
import type { ValuationContext } from './reportValuation';

export type ValueInput = z.input<typeof ReportValueSchema>;
export type MetricInput = z.input<typeof ReportMetricSchema>;
export type TableInput = z.input<typeof ReportTableSchema>;
export type ChartInput = z.input<typeof ReportChartSchema>;

export interface ReportParts {
  readonly title: string;
  readonly metrics: MetricInput[];
  readonly chart: ChartInput | null;
  readonly tables: TableInput[];
  readonly notes: string[];
}

export interface BuildInput {
  readonly v: ValuationContext;
  readonly from: string;
  readonly to: string;
  readonly currency: ReportCurrencyDto;
  readonly withBenchmark: boolean;
}

export const moneyCell = (value: Decimal, currency: ReportCurrencyDto): ValueInput => ({
  kind: 'money',
  money: { amount: value.toFixed(2), currency },
});
// A share or rate by default; pass signed for a change such as a return.
export const percentCell = (value: Decimal | number, signed = false): ValueInput => ({
  kind: 'percent',
  value: Number(value.toFixed(2)),
  signed,
});
export const textCell = (value: string): ValueInput => ({ kind: 'text', value });
export const countCell = (value: number): ValueInput => ({ kind: 'count', value });

export const metric = (
  id: string,
  label: string,
  value: ValueInput,
  note: string | null = null,
): MetricInput => ({ id, label, value, previous: null, benchmark: null, note });

export const column = (
  key: string,
  label: string,
  align: 'start' | 'end' = 'end',
): TableInput['columns'][number] => ({ key, label, align });

export const dayOf = (timestamp: string): string => timestamp.slice(0, 10);
