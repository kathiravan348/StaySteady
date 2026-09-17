// Persistent Side Navigation (UI spec 6).

import { useState, useEffect, type ReactElement } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
import {
  IconOverview,
  IconAlerts,
  IconHoldings,
  IconTransactions,
  IconPerformance,
  IconNetWorth,
  IconWatchlists,
  IconWorkspace,
  IconScreener,
  IconNews,
  IconCalendar,
  IconStrategies,
  IconEditor,
  IconBacktests,
  IconSignals,
  IconApprovals,
  IconOrders,
  IconPositions,
  IconRisk,
  IconAutomation,
  IconJournal,
  IconCompliance,
  IconHealth,
  IconReports,
  IconPlanning,
  IconSettings,
  IconAudit,
  IconContinuity,
  IconWorkbench,
  IconChevron,
  type IconProps,
} from './NavIcons';
import styles from './Sidebar.module.scss';

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: (props: IconProps) => ReactElement;
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
      { to: ROUTES.OVERVIEW, label: 'Overview', icon: IconOverview },
      { to: ROUTES.ALERTS, label: 'Alerts', icon: IconAlerts, badge: 3 },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { to: ROUTES.PORTFOLIO_HOLDINGS, label: 'Holdings', icon: IconHoldings },
      { to: ROUTES.PORTFOLIO_TRANSACTIONS, label: 'Transactions', icon: IconTransactions },
      { to: ROUTES.PORTFOLIO_PERFORMANCE, label: 'Performance', icon: IconPerformance },
      { to: ROUTES.NET_WORTH, label: 'Net Worth', icon: IconNetWorth },
    ],
  },
  {
    title: 'Markets',
    items: [
      { to: ROUTES.MARKETS_WATCHLISTS, label: 'Watchlists', icon: IconWatchlists },
      { to: ROUTES.MARKETS_WORKSPACE, label: 'Workspace', icon: IconWorkspace },
      { to: ROUTES.MARKETS_SCREENER, label: 'Screener', icon: IconScreener },
    ],
  },
  {
    title: 'News & Events',
    items: [
      { to: ROUTES.NEWS_FEED, label: 'Live Feed', icon: IconNews },
      { to: ROUTES.NEWS_CALENDAR, label: 'Event Calendar', icon: IconCalendar },
    ],
  },
  {
    title: 'Research & Backtest',
    items: [
      { to: ROUTES.RESEARCH_STRATEGIES, label: 'Strategies', icon: IconStrategies },
      { to: ROUTES.RESEARCH_EDITOR, label: 'Strategy Editor', icon: IconEditor },
      { to: ROUTES.RESEARCH_BACKTEST_RESULTS, label: 'Backtests', icon: IconBacktests },
    ],
  },
  {
    title: 'Trading & Safety',
    items: [
      { to: ROUTES.TRADING_SIGNALS, label: 'Signals', icon: IconSignals },
      { to: ROUTES.TRADING_APPROVALS, label: 'Approval Queue', icon: IconApprovals, badge: 2 },
      { to: ROUTES.TRADING_ORDERS, label: 'Orders', icon: IconOrders },
      { to: ROUTES.TRADING_POSITIONS, label: 'Positions', icon: IconPositions },
      { to: ROUTES.RISK_LIMITS, label: 'Risk & Limits', icon: IconRisk },
      { to: ROUTES.SETTINGS_AUTOMATION, label: 'What Can Trade', icon: IconAutomation },
      { to: ROUTES.JOURNAL, label: 'Decision Journal', icon: IconJournal },
      { to: ROUTES.COMPLIANCE, label: 'Compliance', icon: IconCompliance },
    ],
  },
  {
    title: 'System & Planning',
    items: [
      { to: ROUTES.HEALTH_STATUS, label: 'System Health', icon: IconHealth },
      { to: ROUTES.REPORTS_PERFORMANCE, label: 'Reports', icon: IconReports },
      { to: ROUTES.PLANNING_ALLOCATION, label: 'Financial Planning', icon: IconPlanning },
      { to: ROUTES.SETTINGS_MARKETS, label: 'Settings & Config', icon: IconSettings },
      { to: ROUTES.AUDIT, label: 'Audit Log', icon: IconAudit },
      { to: ROUTES.CONTINUITY, label: 'Continuity', icon: IconContinuity },
      { to: ROUTES.WORKBENCH, label: 'UI Workbench', icon: IconWorkbench },
    ],
  },
];

export function Sidebar(): ReactElement {
  const location = useLocation();

  // All groups open by default, can be toggled
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    NAVIGATION_GROUPS.reduce<Record<string, boolean>>((acc, g) => {
      acc[g.title] = true;
      return acc;
    }, {}),
  );

  // Auto-expand group containing current route if collapsed
  useEffect(() => {
    const activeGroup = NAVIGATION_GROUPS.find((g) =>
      g.items.some((item) => item.to === location.pathname),
    );
    if (activeGroup && !expandedSections[activeGroup.title]) {
      setExpandedSections((prev) => ({ ...prev, [activeGroup.title]: true }));
    }
  }, [location.pathname]);

  const toggleSection = (title: string): void => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const areAllExpanded = NAVIGATION_GROUPS.every((g) => expandedSections[g.title]);

  const toggleAll = (): void => {
    const nextState = !areAllExpanded;
    setExpandedSections(
      NAVIGATION_GROUPS.reduce<Record<string, boolean>>((acc, g) => {
        acc[g.title] = nextState;
        return acc;
      }, {}),
    );
  };

  return (
    <nav className={styles.sidebar} aria-label="Main Navigation">
      <div className={styles.navHeaderBar}>
        <span className={styles.navHeaderLabel}>Navigation</span>
        <button
          type="button"
          className={styles.toggleAllBtn}
          onClick={toggleAll}
          title={areAllExpanded ? 'Collapse all sections' : 'Expand all sections'}
        >
          {areAllExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className={styles.sectionsContainer}>
        {NAVIGATION_GROUPS.map((group) => {
          const isExpanded = expandedSections[group.title] ?? true;
          return (
            <div key={group.title} className={styles.navSection}>
              <button
                type="button"
                className={styles.sectionHeaderBtn}
                onClick={() => toggleSection(group.title)}
                aria-expanded={isExpanded}
              >
                <span className={styles.sectionTitle}>{group.title}</span>
                <IconChevron
                  className={`${styles.sectionChevron} ${isExpanded ? styles.expanded : ''}`}
                />
              </button>

              {isExpanded && (
                <ul className={styles.navList}>
                  {group.items.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.active : ''}`
                          }
                        >
                          <span className={styles.linkContent}>
                            <span aria-hidden="true" className={styles.iconWrapper}>
                              <IconComponent className={styles.navIcon} />
                            </span>
                            <span className={styles.navLabel}>{item.label}</span>
                          </span>
                          {item.badge !== undefined && (
                            <span className={styles.itemBadge}>{item.badge}</span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>Live Systems Active</span>
        </div>
      </div>
    </nav>
  );
}
