import { useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Card.module.scss';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: ReactNode;
  readonly extra?: ReactNode;
  readonly footer?: ReactNode;
  readonly isInteractive?: boolean;
  readonly isCollapsible?: boolean;
  readonly defaultExpanded?: boolean;
  readonly isExpanded?: boolean;
  readonly onToggleExpand?: (expanded: boolean) => void;
  readonly children: ReactNode;
}

export function Card({
  title,
  extra,
  footer,
  isInteractive = false,
  isCollapsible = false,
  defaultExpanded = true,
  isExpanded: controlledExpanded,
  onToggleExpand,
  className,
  children,
  ...props
}: CardProps): ReactElement {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded ?? (isCollapsible ? uncontrolledExpanded : true);

  const handleToggle = (): void => {
    if (!isCollapsible) return;
    const next = !isExpanded;
    if (controlledExpanded === undefined) {
      setUncontrolledExpanded(next);
    }
    onToggleExpand?.(next);
  };

  return (
    <div
      className={cx(
        styles.card,
        isInteractive && styles.interactive,
        isCollapsible && styles.collapsible,
        isCollapsible && !isExpanded && styles.collapsed,
        className,
      )}
      {...props}
    >
      {(title || extra || isCollapsible) && (
        <div className={styles.header}>
          {isCollapsible ? (
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={handleToggle}
              aria-expanded={isExpanded}
            >
              <svg
                className={cx(styles.collapseChevron, isExpanded && styles.chevronExpanded)}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="7 4 13 10 7 16" />
              </svg>
              {typeof title === 'string' ? <h3 className={styles.title}>{title}</h3> : title}
            </button>
          ) : (
            <div className={styles.titleWrapper}>
              {typeof title === 'string' ? <h3 className={styles.title}>{title}</h3> : title}
            </div>
          )}
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      {isExpanded && <div className={styles.body}>{children}</div>}
      {isExpanded && footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
