import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './SystemStatusState.module.scss';

export type SystemStatusType = 'halted' | 'degraded' | 'offline';

export interface SystemStatusStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly status: SystemStatusType;
  readonly title: string;
  readonly reason: string;
  readonly actions?: ReactNode;
}

export function SystemStatusState({
  status,
  title,
  reason,
  actions,
  className,
  ...props
}: SystemStatusStateProps): ReactElement {
  return (
    <div className={cx(styles.statusCard, styles[status], className)} role="alert" {...props}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {status === 'halted' ? (
          <>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        ) : status === 'degraded' ? (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        ) : (
          <>
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
            <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0122.58 9" />
            <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </>
        )}
      </svg>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.reason}>{reason}</p>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
