import { cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { MarketConfigInput } from '../../../../data/schemas';
import { FieldError } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { parseTime, timeText } from '../model/marketDraft';

type Time = MarketConfigInput['regularHours'][number]['start'];

export interface SectionProps {
  readonly draft: MarketConfigInput;
  readonly isNew: boolean;
  // Every change names the field it touched, so its error can be shown from then on.
  readonly update: (path: string, change: (draft: MarketConfigInput) => MarketConfigInput) => void;
  readonly error: (path: string) => string | undefined;
}

interface BaseFieldProps {
  readonly label: string;
  readonly error: string | undefined;
  readonly isDisabled?: boolean;
  readonly hint?: string;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  isDisabled = false,
  hint,
}: BaseFieldProps & { value: string; onChange: (value: string) => void }): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={cx(styles.input, error === undefined ? undefined : styles.invalid)}
        value={value}
        disabled={isDisabled}
        aria-invalid={error !== undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {hint !== undefined && <span className={styles.meta}>{hint}</span>}
      <FieldError message={error} />
    </label>
  );
}

// An empty box is kept as NaN rather than zero, so it fails validation instead of silently saving 0.
export function NumberField({
  label,
  value,
  onChange,
  error,
  isDisabled = false,
  hint,
  step = 'any',
}: BaseFieldProps & {
  value: number;
  onChange: (value: number) => void;
  step?: string;
}): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="number"
        step={step}
        className={cx(styles.input, error === undefined ? undefined : styles.invalid)}
        value={Number.isNaN(value) ? '' : value}
        disabled={isDisabled}
        aria-invalid={error !== undefined}
        onChange={(event) => {
          onChange(event.target.value === '' ? Number.NaN : Number(event.target.value));
        }}
      />
      {hint !== undefined && <span className={styles.meta}>{hint}</span>}
      <FieldError message={error} />
    </label>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  error,
}: BaseFieldProps & { value: Time; onChange: (value: Time) => void }): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="time"
        className={cx(styles.input, error === undefined ? undefined : styles.invalid)}
        value={timeText(value)}
        aria-invalid={error !== undefined}
        onChange={(event) => {
          const next = parseTime(event.target.value);
          if (next !== null) onChange(next);
        }}
      />
      <FieldError message={error} />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  isDisabled = false,
}: BaseFieldProps & {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={styles.input}
        value={value}
        disabled={isDisabled}
        onChange={(event) => {
          onChange(event.target.value as T);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </label>
  );
}
