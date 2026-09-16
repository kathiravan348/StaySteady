import { cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { FieldError } from './ConfigControls';
import styles from './Config.module.scss';

// Form fields every configuration area uses (UI spec 7.18): a label, the control, an optional hint
// and the inline error from the area's schema.

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
      <FieldError message={error} />
    </label>
  );
}

// A set of checkboxes for picking several values, such as covered markets.
export function CheckboxGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: BaseFieldProps & {
  value: readonly T[];
  options: readonly { value: T; label: string }[];
  onChange: (value: T[]) => void;
}): ReactElement {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.fieldLabel}>{label}</legend>
      <div className={styles.inline}>
        {options.map((option) => (
          <label key={option.value} className={styles.checkOption}>
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(event) => {
                // Kept in the options' order, so ticking and unticking never reorders a saved list.
                onChange(
                  options
                    .map((item) => item.value)
                    .filter((item) =>
                      item === option.value ? event.target.checked : value.includes(item),
                    ),
                );
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}
