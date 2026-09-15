import type { HTMLAttributes, ReactElement } from 'react';
import { Skeleton } from '../../primitives/Skeleton/Skeleton';
import { cx } from '../../utils/cx';
import styles from './LoadingState.module.scss';

export type LoadingLayout = 'table' | 'cards' | 'chart' | 'detail';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly layout?: LoadingLayout;
  readonly count?: number;
}

export function LoadingState({
  layout = 'table',
  count = 5,
  className,
  ...props
}: LoadingStateProps): ReactElement {
  if (layout === 'cards') {
    return (
      <div className={cx(styles.cardsGrid, className)} {...props}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className={styles.cardItem}>
            <Skeleton shape="text" width="60%" height={16} />
            <Skeleton shape="text" width="40%" height={28} />
            <Skeleton shape="text" width="80%" height={12} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'chart') {
    return (
      <div className={cx(styles.container, className)} {...props}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Skeleton shape="text" width={180} height={24} />
          <Skeleton shape="rect" width={220} height={28} />
        </div>
        <Skeleton shape="rect" width="100%" height={320} />
      </div>
    );
  }

  if (layout === 'detail') {
    return (
      <div className={cx(styles.container, className)} {...props}>
        <Skeleton shape="text" width="50%" height={32} />
        <Skeleton shape="text" width="30%" height={18} />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Skeleton shape="rect" width="100%" height={160} />
          <Skeleton shape="rect" width="100%" height={160} />
        </div>
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div className={cx(styles.tableSkeleton, className)} {...props}>
      <div className={styles.tableRow} style={{ marginBottom: '0.5rem' }}>
        <Skeleton shape="text" width="25%" height={18} />
        <Skeleton shape="text" width="20%" height={18} />
        <Skeleton shape="text" width="20%" height={18} />
        <Skeleton shape="text" width="15%" height={18} />
        <Skeleton shape="text" width="20%" height={18} />
      </div>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={styles.tableRow}>
          <Skeleton shape="text" width="25%" height={24} />
          <Skeleton shape="text" width="20%" height={24} />
          <Skeleton shape="text" width="20%" height={24} />
          <Skeleton shape="text" width="15%" height={24} />
          <Skeleton shape="text" width="20%" height={24} />
        </div>
      ))}
    </div>
  );
}
