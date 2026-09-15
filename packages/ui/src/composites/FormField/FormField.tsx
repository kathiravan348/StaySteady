import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './FormField.module.scss';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  readonly label?: string;
  readonly isRequired?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly children: ReactNode;
}

export function FormField({
  label,
  isRequired = false,
  hint,
  error,
  children,
  className,
  ...props
}: FormFieldProps): ReactElement {
  return (
    <div className={cx(styles.field, className)} {...props}>
      {label && (
        <div className={styles.labelRow}>
          <label className={styles.label}>
            {label}
            {isRequired && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>
      )}
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
