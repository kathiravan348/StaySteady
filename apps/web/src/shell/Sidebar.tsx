// Persistent Side Navigation (UI spec 6).

import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.scss';

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: string;
  readonly badge?: number | string;
}

interface NavSectionGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

const NAVIGATION_GROUPS: readonly NavSectionGroup[] = [
  {
    title: 'Core',
    items: [
      { to: '/overview', label: 'Overview', icon: '📊' },
      { to: '/alerts', label: 'Alerts', icon: '🔔', badge: 3 },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { to: '/portfolio/holdings', label: 'Holdings', icon: '💼' },
      { to: '/portfolio/transactions', label: 'Transactions', icon: '📝' },
      { to: '/portfolio/performance', label: 'Performance', icon: '📈' },
    ],
  },
  {
    title: 'Markets',
    items: [
      { to: '/markets/watchlists', label: 'Watchlists', icon: '⭐' },
      { to: '/markets/workspace', label: 'Workspace', icon: '🖥️' },
      { to: '/markets/screener', label: 'Screener', icon: '🔍' },
    ],
  },
  {
    title: 'News & Events',
    items: [
      { to: '/news/feed', label: 'Live Feed', icon: '📰' },
      { to: '/news/calendar', label: 'Event Calendar', icon: '📅' },
    ],
  },
  {
    title: 'Research & Backtest',
    items: [
      { to: '/research/strategies', label: 'Strategies', icon: '🧪' },
      { to: '/research/editor', label: 'Strategy Editor', icon: '✏️' },
      { to: '/research/backtest/results', label: 'Backtests', icon: '⏮️' },
    ],
  },
  {
    title: 'Trading & Safety',
    items: [
      { to: '/trading/signals', label: 'Signals', icon: '⚡' },
      { to: '/trading/approvals', label: 'Approval Queue', icon: '🛡️', badge: 2 },
      { to: '/trading/orders', label: 'Orders', icon: '📦' },
      { to: '/trading/positions', label: 'Positions', icon: '📌' },
      { to: '/risk/limits', label: 'Risk Limits', icon: '⚠️' },
    ],
  },
  {
    title: 'System & Planning',
    items: [
      { to: '/health/status', label: 'System Health', icon: '❤️' },
      { to: '/reports/performance', label: 'Reports', icon: '📑' },
      { to: '/planning/allocation', label: 'Allocation', icon: '🎯' },
      { to: '/settings/markets', label: 'Configuration', icon: '⚙️' },
      { to: '/audit', label: 'Audit Log', icon: '📜' },
    ],
  },
];

export function Sidebar(): ReactElement {
  return (
    <nav className={styles.sidebar} aria-label="Main Navigation">
      {NAVIGATION_GROUPS.map((group) => (
        <div key={group.title} className={styles.navSection}>
          <div className={styles.sectionHeader}>{group.title}</div>
          <ul className={styles.navList}>
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.linkContent}>
                    <span aria-hidden="true" className={styles.iconWrapper}>
                      {item.icon}
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className={styles.itemBadge}>{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
