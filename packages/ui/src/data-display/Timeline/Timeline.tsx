import type { ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Timeline.module.scss';

export type TimelineItemStatus =
  'positive' | 'warning' | 'negative' | 'info' | 'neutral' | 'critical';

export interface TimelineItem {
  readonly id: string;
  readonly title: ReactNode;
  readonly timestamp?: ReactNode;
  readonly detail?: ReactNode;
  readonly badge?: ReactNode;
  readonly status?: TimelineItemStatus;
  readonly isCurrent?: boolean;
  readonly stepNumber?: number | string;
  readonly children?: ReactNode;
}

export interface TimelineProps {
  readonly items: readonly TimelineItem[];
  readonly className?: string;
}

export function Timeline({ items, className }: TimelineProps): ReactElement {
  return (
    <ol className={cx(styles.timeline, className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li
            key={item.id}
            className={cx(
              styles.item,
              item.status && styles[item.status],
              item.isCurrent && styles.current,
              isLast && styles.last,
            )}
          >
            <div className={styles.axis}>
              <div className={styles.node} aria-hidden="true">
                {item.stepNumber !== undefined ? (
                  <span className={styles.stepNum}>{item.stepNumber}</span>
                ) : (
                  <span className={styles.dot} />
                )}
              </div>
              {!isLast && <div className={styles.line} aria-hidden="true" />}
            </div>

            <div className={styles.content}>
              <div className={styles.header}>
                <div className={styles.titleRow}>
                  <span className={styles.title}>{item.title}</span>
                  {item.badge && <div className={styles.badgeWrap}>{item.badge}</div>}
                </div>
                {item.timestamp && <span className={styles.timestamp}>{item.timestamp}</span>}
              </div>

              {item.detail && <div className={styles.detail}>{item.detail}</div>}
              {item.children && <div className={styles.extra}>{item.children}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
