import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './MetricDisplay.module.scss';

export type MetricSize = 'sm' | 'md' | 'lg' | 'xl';
export type MetricDirection = 'positive' | 'negative' | 'neutral';

export interface MetricDisplayProps extends HTMLAttributes<HTMLDivElement> {
  readonly label: string;
  readonly value: string | number;
  readonly size?: MetricSize;
  readonly changeValue?: string | number;
  readonly direction?: MetricDirection;
  readonly subLabel?: string;
  readonly tooltip?: ReactNode;
}

export function MetricDisplay({
  label,
  value,
  size = 'md',
  changeValue,
  direction = 'neutral',
  subLabel,
  tooltip,
  className,
  ...props
}: MetricDisplayProps): ReactElement {
  return (
    <div className={cx(styles.container, className)} {...props}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {tooltip}
      </div>
      <div className={styles.valueRow}>
        <span className={cx(styles.value, styles[size])}>{value}</span>
        {changeValue !== undefined && (
          <span className={cx(styles.diffBadge, styles[direction])}>
            {direction === 'positive' ? '▲ ' : direction === 'negative' ? '▼ ' : ''}
            {changeValue}
          </span>
        )}
      </div>
      {subLabel && <span className={styles.subLabel}>{subLabel}</span>}
    </div>
  );
}
