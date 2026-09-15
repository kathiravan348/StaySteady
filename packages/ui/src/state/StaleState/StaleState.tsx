import type { HTMLAttributes, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import styles from './StaleState.module.scss';

export interface StaleStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly ageText: string;
  readonly lastUpdated?: string;
  readonly isBanner?: boolean;
  readonly onRefresh?: () => void;
}

export function StaleState({
  ageText,
  lastUpdated,
  isBanner = false,
  onRefresh,
  className,
  ...props
}: StaleStateProps): ReactElement {
  if (isBanner) {
    return (
      <div className={cx(styles.staleBanner, className)} role="status" {...props}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Data may be delayed ({ageText})</span>
          {lastUpdated && <span style={{ opacity: 0.8 }}>• Last update: {lastUpdated}</span>}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cx(styles.stalePill, className)} role="status" {...props}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>Stale ({ageText})</span>
    </div>
  );
}
