import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Card.module.scss';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: ReactNode;
  readonly extra?: ReactNode;
  readonly footer?: ReactNode;
  readonly isInteractive?: boolean;
  readonly children: ReactNode;
}

export function Card({
  title,
  extra,
  footer,
  isInteractive = false,
  className,
  children,
  ...props
}: CardProps): ReactElement {
  return (
    <div className={cx(styles.card, isInteractive && styles.interactive, className)} {...props}>
      {(title || extra) && (
        <div className={styles.header}>
          {typeof title === 'string' ? <h3 className={styles.title}>{title}</h3> : title}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
