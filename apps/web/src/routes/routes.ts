// Centralized route constants and path helpers (UI spec 6).

export const ROUTES = {
  // Core
  OVERVIEW: '/overview',
  ALERTS: '/alerts',
  AUDIT: '/audit',

  // Portfolio
  PORTFOLIO_HOLDINGS: '/portfolio/holdings',
  PORTFOLIO_POSITION: '/portfolio/positions/:id',
  PORTFOLIO_TRANSACTIONS: '/portfolio/transactions',
  PORTFOLIO_PERFORMANCE: '/portfolio/performance',

  // Markets
  MARKETS_WATCHLISTS: '/markets/watchlists',
  MARKETS_WORKSPACE: '/markets/workspace',
  MARKETS_WORKSPACE_TICKER: '/markets/workspace/:ticker',
  MARKETS_SCREENER: '/markets/screener',

  // News & Events
  NEWS_FEED: '/news/feed',
  NEWS_CALENDAR: '/news/calendar',

  // Research
  RESEARCH_STRATEGIES: '/research/strategies',
  RESEARCH_EDITOR: '/research/editor',
  RESEARCH_EDITOR_ID: '/research/editor/:id',
  RESEARCH_BACKTEST_NEW: '/research/backtest/new',
  RESEARCH_BACKTEST_RESULTS: '/research/backtest/results',
  RESEARCH_BACKTEST_RESULTS_ID: '/research/backtest/results/:id',
  RESEARCH_BACKTEST_COMPARE: '/research/backtest/compare',

  // Trading & Automation
  TRADING_SIGNALS: '/trading/signals',
  TRADING_APPROVALS: '/trading/approvals',
  TRADING_ORDERS: '/trading/orders',
  TRADING_POSITIONS: '/trading/positions',

  // Risk & Safety
  RISK_LIMITS: '/risk/limits',
  RISK_BREACHES: '/risk/breaches',

  // System Health
  HEALTH_STATUS: '/health/status',
  HEALTH_INCIDENTS: '/health/incidents',
  HEALTH_RELIABILITY: '/health/reliability',

  // Reports
  REPORTS_PERFORMANCE: '/reports/performance',
  REPORTS_COSTS: '/reports/costs',
  REPORTS_TAX: '/reports/tax',

  // Planning
  PLANNING_ALLOCATION: '/planning/allocation',
  PLANNING_GOALS: '/planning/goals',
  PLANNING_SCENARIOS: '/planning/scenarios',

  // Settings & Configuration
  SETTINGS_MARKETS: '/settings/markets',
  SETTINGS_PROVIDERS: '/settings/providers',
  SETTINGS_BROKERS: '/settings/brokers',
  SETTINGS_INSTRUMENTS: '/settings/instruments',
  SETTINGS_CURRENCIES: '/settings/currencies',
  SETTINGS_ALERTS: '/settings/alerts',
  SETTINGS_CREDENTIALS: '/settings/credentials',
  SETTINGS_DISPLAY: '/settings/display',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export function positionDetailPath(id: string): string {
  return `/portfolio/positions/${encodeURIComponent(id)}`;
}

export function workspaceTickerPath(ticker: string): string {
  return `/markets/workspace/${encodeURIComponent(ticker)}`;
}

export function strategyEditorPath(id: string): string {
  return `/research/editor/${encodeURIComponent(id)}`;
}

export function backtestResultsPath(id: string): string {
  return `/research/backtest/results/${encodeURIComponent(id)}`;
}
