import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';

import { ROUTES } from '../../../routes/routes';
import styles from '../Health.module.scss';

const SECTIONS = [
  { to: ROUTES.HEALTH_STATUS, label: 'Live status' },
  { to: ROUTES.HEALTH_RELIABILITY, label: 'Reliability' },
  { to: ROUTES.HEALTH_INCIDENTS, label: 'Incidents' },
] as const;

// The System Health screen is split across three routes; this keeps them one place to navigate.
export function HealthNav(): ReactElement {
  return (
    <nav aria-label="System health sections">
      <ul className={styles.nav}>
        {SECTIONS.map((section) => (
          <li key={section.to}>
            <NavLink to={section.to} className={styles.navLink ?? ''}>
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
