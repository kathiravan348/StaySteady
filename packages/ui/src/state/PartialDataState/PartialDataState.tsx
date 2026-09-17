import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cx } from '../../utils/cx';
import styles from './PartialDataState.module.scss';

export interface PartialDataSource {
  readonly name: string;
  // What the reader loses while this source is unavailable.
  readonly impact: string;
}

export interface PartialDataStateProps extends HTMLAttributes<HTMLDivElement> {
  // Sources that failed; everything else in the section is still shown.
  readonly unavailable: readonly PartialDataSource[];
  readonly title?: string;
  readonly onRetry?: () => void;
  // The part of the section that did load.
  readonly children?: ReactNode;
}

// UI spec 10 — partial data: some markets or providers unavailable, others fine, shown per section
// rather than globally. Renders nothing extra when every source is available.
export function PartialDataState({
  unavailable,
  title = 'Some data is unavailable',
  onRetry,
  children,
  className,
  ...props
}: PartialDataStateProps): ReactElement {
  return (
    <div className={cx(styles.section, className)} {...props}>
      {unavailable.length > 0 && (
        <div className={styles.notice} role="status">
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            {onRetry !== undefined && (
              <button type="button" className={styles.retry} onClick={onRetry}>
                Try again
              </button>
            )}
          </div>
          <ul className={styles.list}>
            {unavailable.map((source) => (
              <li key={source.name} className={styles.item}>
                <span className={styles.name}>{source.name}:</span> {source.impact}
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
    </div>
  );
}
