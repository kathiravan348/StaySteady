import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Badge.module.scss';

export type BadgeVariant = 'neutral' | 'positive' | 'negative' | 'warning' | 'critical' | 'info';
export type BadgeSize = 'sm' | 'md';
export type BadgeShape = 'pill' | 'rounded';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly shape?: BadgeShape;
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  shape = 'pill',
  icon,
  className,
  children,
  ...props
}: BadgeProps): ReactElement {
  return (
    <span
      {...props}
      className={cx(styles.badge, styles[variant], styles[size], styles[shape], className)}
    >
      {icon}
      {children}
    </span>
  );
}
