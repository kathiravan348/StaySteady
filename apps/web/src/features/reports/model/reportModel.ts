// Reports (UI spec 7.16): report types, period presets, value formatting and CSV export.

import type { ReportDto, ReportTypeDto, ReportValueDto } from '../../../data/schemas';
import { moneyFromDto } from '../../../data/api';
import { formatMoney, formatPercentage } from '../../../shared/format';
import { subtractMoney } from '../../../shared/money';

export const REPORT_TYPES: readonly { value: ReportTypeDto; label: string; description: string }[] =
  [
    {
      value: 'performance',
      label: 'Performance',
      description:
        'Returns, money added and the currency effect, against a benchmark or the previous period.',
    },
    {
      value: 'allocation',
      label: 'Allocation',
      description:
        'Where the money sits at the end of the period, by type, market, currency and broker.',
    },
    {
      value: 'costs',
      label: 'Costs',
      description: 'Commissions and currency conversion charges paid.',
    },
    {
      value: 'income',
      label: 'Income',
      description: 'Dividends received and the tax withheld on them.',
    },
    {
      value: 'tax',
      label: 'Tax summary',
      description: 'Realised and unrealised gains by holding period, with an estimated tax.',
    },
    {
      value: 'attribution',
      label: 'Strategy attribution',
      description: 'How much of the gain came from each strategy and from manual decisions.',
    },
  ];

export const PERIOD_PRESETS = [
  'month',
  'last_month',
  'quarter',
  'ytd',
  'last_12_months',
  'custom',
] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PRESET_LABELS: Readonly<Record<PeriodPreset, string>> = {
  month: 'This month',
  last_month: 'Last month',
  quarter: 'This quarter',
  ytd: 'Year to date',
  last_12_months: 'Last 12 months',
  custom: 'Custom',
};

const iso = (date: Date): string => date.toISOString().slice(0, 10);

// Periods end yesterday: today's closing prices do not exist yet.
export function presetPeriod(
  preset: Exclude<PeriodPreset, 'custom'>,
  now: Date,
): { from: string; to: string } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const year = end.getUTCFullYear();
  const month = end.getUTCMonth();
  switch (preset) {
    case 'month':
      return { from: iso(new Date(Date.UTC(year, month, 1))), to: iso(end) };
    case 'last_month':
      return {
        from: iso(new Date(Date.UTC(year, month - 1, 1))),
        to: iso(new Date(Date.UTC(year, month, 0))),
      };
    case 'quarter':
      return { from: iso(new Date(Date.UTC(year, month - (month % 3), 1))), to: iso(end) };
    case 'ytd':
      return { from: iso(new Date(Date.UTC(year, 0, 1))), to: iso(end) };
    case 'last_12_months':
      return { from: iso(new Date(Date.UTC(year - 1, month, end.getUTCDate() + 1))), to: iso(end) };
  }
}

export function formatReportValue(value: ReportValueDto): string {
  switch (value.kind) {
    case 'money':
      return formatMoney(moneyFromDto(value.money));
    case 'percent':
      return formatPercentage(value.value, { decimals: 2, signed: value.signed });
    case 'count':
      return value.value.toLocaleString('en-US');
    case 'text':
      return value.value;
  }
}

// The change from a comparison value, in the value's own terms: money for money, points for percentages.
export function formatChange(current: ReportValueDto, other: ReportValueDto): string | null {
  if (
    current.kind === 'money' &&
    other.kind === 'money' &&
    current.money.currency === other.money.currency
  ) {
    return formatMoney(subtractMoney(moneyFromDto(current.money), moneyFromDto(other.money)), {
      signed: true,
    });
  }
  if (current.kind === 'percent' && other.kind === 'percent') {
    const points = current.value - other.value;
    return `${points >= 0 ? '+' : ''}${points.toFixed(2)} pts`;
  }
  if (current.kind === 'count' && other.kind === 'count') {
    const change = current.value - other.value;
    return `${change >= 0 ? '+' : ''}${String(change)}`;
  }
  return null;
}

const csvCell = (text: string): string =>
  /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;

// Plain values in export: money as "amount currency" so spreadsheets can sum it.
const exportValue = (value: ReportValueDto): string =>
  value.kind === 'money'
    ? `${value.money.amount} ${value.money.currency}`
    : value.kind === 'percent'
      ? value.value.toFixed(2)
      : String(value.value);

export function reportToCsv(report: ReportDto): string {
  const lines: string[][] = [
    [report.title, `${report.period.from} to ${report.period.to}`, report.currency],
    [],
    ['Metric', 'Value', 'Previous period', 'Benchmark'],
    ...report.metrics.map((item) => [
      item.label,
      exportValue(item.value),
      item.previous === null ? '' : exportValue(item.previous),
      item.benchmark === null ? '' : exportValue(item.benchmark),
    ]),
  ];
  report.tables.forEach((table) => {
    lines.push(
      [],
      [table.title],
      table.columns.map((col) => col.label),
    );
    const cells = (record: Record<string, ReportValueDto>): string[] =>
      table.columns.map((col) => {
        const value = record[col.key];
        return value === undefined ? '' : exportValue(value);
      });
    table.rows.forEach((row) => lines.push(cells(row.cells)));
    if (table.total !== null) lines.push(cells(table.total));
  });
  lines.push([], ...report.notes.map((note) => [note]));
  return `${lines.map((line) => line.map(csvCell).join(',')).join('\n')}\n`;
}
