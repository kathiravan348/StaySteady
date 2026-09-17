// Persistent Side Navigation (UI spec 6).

import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
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
      { to: ROUTES.OVERVIEW, label: 'Overview', icon: '📊' },
      { to: ROUTES.ALERTS, label: 'Alerts', icon: '🔔', badge: 3 },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { to: ROUTES.PORTFOLIO_HOLDINGS, label: 'Holdings', icon: '💼' },
      { to: ROUTES.PORTFOLIO_TRANSACTIONS, label: 'Transactions', icon: '📝' },
      { to: ROUTES.PORTFOLIO_PERFORMANCE, label: 'Performance', icon: '📈' },
      { to: ROUTES.NET_WORTH, label: 'Net Worth', icon: '🏦' },
    ],
  },
  {
    title: 'Markets',
    items: [
      { to: ROUTES.MARKETS_WATCHLISTS, label: 'Watchlists', icon: '⭐' },
      { to: ROUTES.MARKETS_WORKSPACE, label: 'Workspace', icon: '🖥️' },
      { to: ROUTES.MARKETS_SCREENER, label: 'Screener', icon: '🔍' },
    ],
  },
  {
    title: 'News & Events',
    items: [
      { to: ROUTES.NEWS_FEED, label: 'Live Feed', icon: '📰' },
      { to: ROUTES.NEWS_CALENDAR, label: 'Event Calendar', icon: '📅' },
    ],
  },
  {
    title: 'Research & Backtest',
    items: [
      { to: ROUTES.RESEARCH_STRATEGIES, label: 'Strategies', icon: '🧪' },
      { to: ROUTES.RESEARCH_EDITOR, label: 'Strategy Editor', icon: '✏️' },
      { to: ROUTES.RESEARCH_BACKTEST_RESULTS, label: 'Backtests', icon: '⏮️' },
    ],
  },
  {
    title: 'Trading & Safety',
    items: [
      { to: ROUTES.TRADING_SIGNALS, label: 'Signals', icon: '⚡' },
      { to: ROUTES.TRADING_APPROVALS, label: 'Approval Queue', icon: '🛡️', badge: 2 },
      { to: ROUTES.TRADING_ORDERS, label: 'Orders', icon: '📦' },
      { to: ROUTES.TRADING_POSITIONS, label: 'Positions', icon: '📌' },
      { to: ROUTES.RISK_LIMITS, label: 'Risk & Limits', icon: '⚠️' },
      { to: ROUTES.SETTINGS_AUTOMATION, label: 'What Can Trade', icon: '🔐' },
      { to: ROUTES.JOURNAL, label: 'Decision Journal', icon: '📓' },
      { to: ROUTES.COMPLIANCE, label: 'Compliance', icon: '⚖️' },
    ],
  },
  {
    title: 'System & Planning',
    items: [
      { to: ROUTES.HEALTH_STATUS, label: 'System Health', icon: '❤️' },
      { to: ROUTES.REPORTS_PERFORMANCE, label: 'Reports', icon: '📑' },
      { to: ROUTES.PLANNING_ALLOCATION, label: 'Financial Planning', icon: '🎯' },
      { to: ROUTES.SETTINGS_MARKETS, label: 'Settings & Config', icon: '⚙️' },
      { to: ROUTES.AUDIT, label: 'Audit Log', icon: '📜' },
      { to: ROUTES.CONTINUITY, label: 'Continuity', icon: '🕊️' },
      { to: ROUTES.WORKBENCH, label: 'UI Workbench', icon: '🧩' },
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
