import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './NoResultsState.module.scss';

export interface NoResultsStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly title?: string;
  readonly description?: string;
  readonly onClearFilters?: () => void;
  readonly clearLabel?: string;
  readonly action?: ReactNode;
}

export function NoResultsState({
  title = 'No results found',
  description = 'Try adjusting your search query or filters to find what you are looking for.',
  onClearFilters,
  clearLabel = 'Clear all filters',
  action,
  className,
  ...props
}: NoResultsStateProps): ReactElement {
  return (
    <div className={cx(styles.container, className)} {...props}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            background: 'var(--surface-raised, #1e293b)',
            border: '1px solid var(--border-subtle, #334155)',
            color: 'var(--text-primary, #f8fafc)',
            borderRadius: 'var(--radius-md, 0.375rem)',
            padding: '0.375rem 0.75rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {clearLabel}
        </button>
      ) : (
        action
      )}
    </div>
  );
}
