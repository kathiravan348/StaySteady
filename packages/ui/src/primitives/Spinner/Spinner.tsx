import type { HTMLAttributes, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import styles from './Spinner.module.scss';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  readonly size?: SpinnerSize;
  readonly label?: string;
}

export function Spinner({
  size = 'md',
  label = 'Loading...',
  className,
  ...props
}: SpinnerProps): ReactElement {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(styles.spinner, styles[size], className)}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>
  );
}
