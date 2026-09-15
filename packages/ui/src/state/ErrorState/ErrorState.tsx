import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Button } from '../../primitives/Button/Button';
import { cx } from '../../utils/cx';
import styles from './ErrorState.module.scss';

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly title?: string;
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly action?: ReactNode;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the service.',
  onRetry,
  retryLabel = 'Try again',
  action,
  className,
  ...props
}: ErrorStateProps): ReactElement {
  return (
    <div className={cx(styles.container, className)} role="alert" {...props}>
      <div className={styles.iconWrapper}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onPress={onRetry}>
          {retryLabel}
        </Button>
      ) : (
        action
      )}
    </div>
  );
}
