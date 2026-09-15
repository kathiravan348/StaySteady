import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './KeyValuePair.module.scss';

export interface KeyValuePairProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly layout?: 'horizontal' | 'stacked';
  readonly isMono?: boolean;
}

export function KeyValuePair({
  label,
  value,
  layout = 'horizontal',
  isMono = false,
  className,
  ...props
}: KeyValuePairProps): ReactElement {
  return (
    <div className={cx(styles.pair, styles[layout], className)} {...props}>
      <span className={styles.label}>{label}</span>
      <span className={cx(styles.value, isMono && styles.mono)}>{value}</span>
    </div>
  );
}
