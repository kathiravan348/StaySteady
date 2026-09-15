// Reusable Page Shell component with breadcrumbs and state slots (standards 4.2 and UI spec 1).

import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './PageShell.module.scss';

export interface BreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}

export interface PageShellProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly actions?: ReactNode;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly empty?: boolean;
  readonly emptyMessage?: string;
  readonly children?: ReactNode;
}

export function PageShell({
  title,
  description,
  breadcrumbs,
  actions,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No items found',
  children,
}: PageShellProps): ReactElement {
  return (
    <div className={styles.pageShell}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.label} className={styles.breadcrumbItem}>
              {idx > 0 && <span className={styles.breadcrumbSeparator}> / </span>}
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </span>
          ))}
        </nav>
      )}

      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>

      <div className={styles.content}>
        {loading && (
          <div className={styles.stateBox} role="status" aria-live="polite">
            <span>⏳ Loading data...</span>
          </div>
        )}

        {!loading && error && (
          <div className={`${styles.stateBox} ${styles.error}`} role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!loading && !error && empty && (
          <div className={styles.stateBox}>
            <span>📭 {emptyMessage}</span>
          </div>
        )}

        {!loading && !error && !empty && children}
      </div>
    </div>
  );
}
