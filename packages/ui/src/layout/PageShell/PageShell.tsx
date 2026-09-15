import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './PageShell.module.scss';

export interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  readonly header?: ReactNode;
  readonly sidebar?: ReactNode;
  readonly statusStrip?: ReactNode;
  readonly children: ReactNode;
}

export function PageShell({
  header,
  sidebar,
  statusStrip,
  children,
  className,
  ...props
}: PageShellProps): ReactElement {
  return (
    <div className={cx(styles.pageShell, className)} {...props}>
      {header && <div className={styles.topRow}>{header}</div>}
      <div className={styles.mainContainer}>
        {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
        <main className={styles.content}>{children}</main>
      </div>
      {statusStrip && <div className={styles.statusStrip}>{statusStrip}</div>}
    </div>
  );
}
