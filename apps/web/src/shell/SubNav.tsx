import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SubNav.module.scss';

export interface SubNavItem {
  readonly to: string;
  readonly label: string;
  readonly badge?: number | string;
  readonly end?: boolean;
}

export interface SubNavProps {
  readonly ariaLabel: string;
  readonly items: readonly SubNavItem[];
}

export function SubNav({ ariaLabel, items }: SubNavProps): ReactElement {
  return (
    <nav aria-label={ariaLabel} className={styles.container}>
      <ul className={styles.nav}>
        {items.map((item) => (
          <li key={item.to} className={styles.item}>
            <NavLink
              to={item.to}
              {...(item.end !== undefined && { end: item.end })}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && <span className={styles.badge}>{item.badge}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
