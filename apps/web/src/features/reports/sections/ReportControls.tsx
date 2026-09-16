import type { ReactElement } from 'react';

import type { ReportComparisonDto, ReportCurrencyDto, ReportTypeDto } from '../../../data/schemas';
import { BASE_CURRENCIES } from '../../../shared/types/currency';
import type { PeriodPreset } from '../model/reportModel';
import { PERIOD_PRESETS, PRESET_LABELS, REPORT_TYPES } from '../model/reportModel';
import styles from '../Reports.module.scss';

export interface ReportSettings {
  readonly type: ReportTypeDto;
  readonly preset: PeriodPreset;
  readonly from: string;
  readonly to: string;
  readonly currency: ReportCurrencyDto;
  readonly comparison: ReportComparisonDto;
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly { value: T; label: string }[];
  readonly onChange: (value: T) => void;
}): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={styles.input}
        value={value}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next !== undefined) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const COMPARISONS: readonly { value: ReportComparisonDto; label: string }[] = [
  { value: 'none', label: 'No comparison' },
  { value: 'previous', label: 'Previous period' },
  { value: 'benchmark', label: 'Benchmark (S&P 500)' },
];

export function ReportControls({
  settings,
  maxDate,
  onChange,
}: {
  readonly settings: ReportSettings;
  readonly maxDate: string;
  readonly onChange: (settings: ReportSettings) => void;
}): ReactElement {
  const set = (change: Partial<ReportSettings>): void => {
    onChange({ ...settings, ...change });
  };
  const date = (key: 'from' | 'to', label: string): ReactElement => (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="date"
        className={styles.input}
        value={settings[key]}
        max={maxDate}
        onChange={(event) => {
          set({ [key]: event.target.value, preset: 'custom' });
        }}
      />
    </label>
  );
  return (
    <div className={styles.controls} role="group" aria-label="Report settings">
      <Select
        label="Report"
        value={settings.type}
        options={REPORT_TYPES.map((item) => ({ value: item.value, label: item.label }))}
        onChange={(type) => {
          set({ type });
        }}
      />
      <Select
        label="Period"
        value={settings.preset}
        options={PERIOD_PRESETS.map((preset) => ({ value: preset, label: PRESET_LABELS[preset] }))}
        onChange={(preset) => {
          set({ preset });
        }}
      />
      {date('from', 'From')}
      {date('to', 'To')}
      <Select
        label="Currency for the whole report"
        value={settings.currency}
        options={BASE_CURRENCIES.map((code) => ({ value: code, label: code }))}
        onChange={(currency) => {
          set({ currency });
        }}
      />
      <Select
        label="Compare with"
        value={settings.comparison}
        options={COMPARISONS}
        onChange={(comparison) => {
          set({ comparison });
        }}
      />
    </div>
  );
}
