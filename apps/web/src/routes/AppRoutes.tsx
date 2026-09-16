// Full application route map per UI spec section 6.

import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../shell/AppShell';
import { ROUTES } from './routes';

import { OverviewPage } from '../features/overview/OverviewPage';
import { AlertsPage } from '../features/alerts/AlertsPage';
import { AuditLogPage } from '../features/audit/AuditLogPage';
import { NotFoundPage } from '../features/notFound/NotFoundPage';

import { PortfolioHoldingsPage } from '../features/portfolio/PortfolioHoldingsPage';
import { PortfolioTransactionsPage } from '../features/portfolio/PortfolioTransactionsPage';
import { PortfolioPerformancePage } from '../features/portfolio/PortfolioPerformancePage';
import { PositionDetailPage } from '../features/portfolio/PositionDetailPage';

import { MarketsWatchlistsPage } from '../features/markets/MarketsWatchlistsPage';
import { MarketsWorkspacePage } from '../features/markets/MarketsWorkspacePage';
import { MarketsScreenerPage } from '../features/markets/MarketsScreenerPage';

import { NewsFeedPage } from '../features/news/NewsFeedPage';
import { NewsCalendarPage } from '../features/news/NewsCalendarPage';

import { ResearchStrategiesPage } from '../features/research/ResearchStrategiesPage';
import { ResearchEditorPage } from '../features/research/ResearchEditorPage';
import { BacktestSetupPage } from '../features/research/BacktestSetupPage';
import { BacktestResultsPage } from '../features/research/BacktestResultsPage';
import { BacktestComparePage } from '../features/research/BacktestComparePage';

import { TradingSignalsPage } from '../features/trading/TradingSignalsPage';
import { TradingApprovalsPage } from '../features/trading/TradingApprovalsPage';
import { TradingOrdersPage } from '../features/trading/TradingOrdersPage';
import { TradingPositionsPage } from '../features/trading/TradingPositionsPage';

import { RiskLimitsPage } from '../features/risk/RiskLimitsPage';
import { RiskBreachesPage } from '../features/risk/RiskBreachesPage';

import { HealthStatusPage } from '../features/health/HealthStatusPage';
import { HealthIncidentsPage } from '../features/health/HealthIncidentsPage';
import { HealthReliabilityPage } from '../features/health/HealthReliabilityPage';

import { ReportsPerformancePage } from '../features/reports/ReportsPerformancePage';
import { ReportsCostsPage } from '../features/reports/ReportsCostsPage';
import { ReportsTaxPage } from '../features/reports/ReportsTaxPage';

import { PlanningAllocationPage } from '../features/planning/PlanningAllocationPage';
import { PlanningGoalsPage } from '../features/planning/PlanningGoalsPage';
import { PlanningScenariosPage } from '../features/planning/PlanningScenariosPage';

import { SettingsMarketsPage } from '../features/settings/SettingsMarketsPage';
import { SettingsBrokersPage } from '../features/settings/SettingsBrokersPage';
import { SettingsProvidersPage } from '../features/settings/SettingsProvidersPage';
import { SettingsDisplayPage } from '../features/settings/SettingsDisplayPage';
import { WorkbenchShell } from '@staysteady/ui';

export function AppRoutes(): ReactElement {
  return (
    <Routes>
      {/* Component Workbench */}
      <Route path={ROUTES.WORKBENCH} element={<WorkbenchShell />} />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.OVERVIEW} replace />} />

        {/* Core */}
        <Route path={ROUTES.OVERVIEW} element={<OverviewPage />} />
        <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
        <Route path={ROUTES.AUDIT} element={<AuditLogPage />} />

        {/* Portfolio */}
        <Route path={ROUTES.PORTFOLIO_HOLDINGS} element={<PortfolioHoldingsPage />} />
        <Route path={ROUTES.PORTFOLIO_POSITION} element={<PositionDetailPage />} />
        <Route path={ROUTES.PORTFOLIO_TRANSACTIONS} element={<PortfolioTransactionsPage />} />
        <Route path={ROUTES.PORTFOLIO_PERFORMANCE} element={<PortfolioPerformancePage />} />

        {/* Markets */}
        <Route path={ROUTES.MARKETS_WATCHLISTS} element={<MarketsWatchlistsPage />} />
        <Route path={ROUTES.MARKETS_WORKSPACE} element={<MarketsWorkspacePage />} />
        <Route path={ROUTES.MARKETS_WORKSPACE_TICKER} element={<MarketsWorkspacePage />} />
        <Route path={ROUTES.MARKETS_SCREENER} element={<MarketsScreenerPage />} />

        {/* News & Events */}
        <Route path={ROUTES.NEWS_FEED} element={<NewsFeedPage />} />
        <Route path={ROUTES.NEWS_CALENDAR} element={<NewsCalendarPage />} />

        {/* Research */}
        <Route path={ROUTES.RESEARCH_STRATEGIES} element={<ResearchStrategiesPage />} />
        <Route path={ROUTES.RESEARCH_EDITOR} element={<ResearchEditorPage />} />
        <Route path={ROUTES.RESEARCH_EDITOR_ID} element={<ResearchEditorPage />} />
        <Route path={ROUTES.RESEARCH_BACKTEST_NEW} element={<BacktestSetupPage />} />
        <Route path={ROUTES.RESEARCH_BACKTEST_RESULTS} element={<BacktestResultsPage />} />
        <Route path={ROUTES.RESEARCH_BACKTEST_RESULTS_ID} element={<BacktestResultsPage />} />
        <Route path={ROUTES.RESEARCH_BACKTEST_COMPARE} element={<BacktestComparePage />} />

        {/* Trading */}
        <Route path={ROUTES.TRADING_SIGNALS} element={<TradingSignalsPage />} />
        <Route path={ROUTES.TRADING_APPROVALS} element={<TradingApprovalsPage />} />
        <Route path={ROUTES.TRADING_ORDERS} element={<TradingOrdersPage />} />
        <Route path={ROUTES.TRADING_POSITIONS} element={<TradingPositionsPage />} />

        {/* Risk */}
        <Route path={ROUTES.RISK_LIMITS} element={<RiskLimitsPage />} />
        <Route path={ROUTES.RISK_BREACHES} element={<RiskBreachesPage />} />

        {/* Health */}
        <Route path={ROUTES.HEALTH_STATUS} element={<HealthStatusPage />} />
        <Route path={ROUTES.HEALTH_INCIDENTS} element={<HealthIncidentsPage />} />
        <Route path={ROUTES.HEALTH_RELIABILITY} element={<HealthReliabilityPage />} />

        {/* Reports */}
        <Route path={ROUTES.REPORTS_PERFORMANCE} element={<ReportsPerformancePage />} />
        <Route path={ROUTES.REPORTS_COSTS} element={<ReportsCostsPage />} />
        <Route path={ROUTES.REPORTS_TAX} element={<ReportsTaxPage />} />

        {/* Planning */}
        <Route path={ROUTES.PLANNING_ALLOCATION} element={<PlanningAllocationPage />} />
        <Route path={ROUTES.PLANNING_GOALS} element={<PlanningGoalsPage />} />
        <Route path={ROUTES.PLANNING_SCENARIOS} element={<PlanningScenariosPage />} />

        {/* Settings */}
        <Route path={ROUTES.SETTINGS_MARKETS} element={<SettingsMarketsPage />} />
        <Route path={ROUTES.SETTINGS_PROVIDERS} element={<SettingsProvidersPage />} />
        <Route path={ROUTES.SETTINGS_BROKERS} element={<SettingsBrokersPage area="Brokers" />} />
        <Route path={ROUTES.SETTINGS_INSTRUMENTS} element={<SettingsMarketsPage />} />
        <Route path={ROUTES.SETTINGS_CURRENCIES} element={<SettingsMarketsPage />} />
        <Route path={ROUTES.SETTINGS_ALERTS} element={<AlertsPage />} />
        <Route
          path={ROUTES.SETTINGS_CREDENTIALS}
          element={<SettingsBrokersPage area="Credentials" />}
        />
        <Route path={ROUTES.SETTINGS_DISPLAY} element={<SettingsDisplayPage />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
