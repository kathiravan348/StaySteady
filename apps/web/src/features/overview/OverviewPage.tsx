// Overview landing screen (UI spec 7.1): is everything fine, and where do I stand?

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '../../routes/routes';
import { formatMoney } from '../../shared/format';
import { PageShell } from '../../shell/PageShell';
import styles from './OverviewPage.module.scss';
import { AllocationSection } from './sections/AllocationSection';
import { AttentionSection } from './sections/AttentionSection';
import { HeadlineCards } from './sections/HeadlineCards';
import { HoldingsNewsSection } from './sections/HoldingsNewsSection';
import { PriceFreshnessBar } from '../../shared/ui/PriceFreshnessBar';
import { PortfolioValueSection } from './sections/PortfolioValueSection';
import { RecentAlertsSection } from './sections/RecentAlertsSection';
import { TopMoversSection } from './sections/TopMoversSection';
import { UpcomingEventsSection } from './sections/UpcomingEventsSection';
import type { OverviewCoreState } from './useOverviewCore';
import { useOverviewCore } from './useOverviewCore';
import type { OverviewSignals } from './useOverviewSignals';
import { useOverviewSignals } from './useOverviewSignals';

function renderContent(core: OverviewCoreState, signals: OverviewSignals): ReactElement {
  switch (core.status) {
    case 'loading':
      // Skeletons match the final layout so nothing jumps when data arrives (UI spec 10).
      return (
        <div className={styles.layout} aria-busy="true">
          <LoadingState layout="cards" count={6} />
          <LoadingState layout="chart" />
        </div>
      );
    case 'error':
      return (
        <ErrorState
          title="Portfolio data unavailable"
          message={core.message}
          onRetry={core.retry}
        />
      );
    case 'empty':
      return (
        <div className={styles.layout}>
          <EmptyState
            title="No holdings yet"
            description={`Cash available: ${formatMoney(core.cash)}. Add a holding manually or import your transactions to see where you stand.`}
            action={
              <Link to={ROUTES.PORTFOLIO_TRANSACTIONS} className={styles.emptyAction}>
                Add or import holdings
              </Link>
            }
          />
          <RecentAlertsSection />
        </div>
      );
    case 'ready':
      return (
        <div className={styles.layout}>
          <PriceFreshnessBar
            oldestQuoteTimestamp={core.overview.oldestQuoteTimestamp}
            heldMarketIds={core.heldMarketIds}
          />
          <HeadlineCards headline={core.overview.headline} signals={signals} />
          <div className={styles.columns}>
            <div className={styles.column}>
              <PortfolioValueSection holdings={core.holdings} instruments={core.instruments} />
              <AllocationSection allocation={core.overview.allocation} />
              <TopMoversSection positions={core.overview.positions} />
              <AttentionSection positions={core.overview.positions} />
            </div>
            <aside className={styles.column} aria-label="News, events and alerts">
              <HoldingsNewsSection heldInstrumentIds={core.heldInstrumentIds} />
              <UpcomingEventsSection heldMarketIds={core.heldMarketIds} />
              <RecentAlertsSection />
            </aside>
          </div>
        </div>
      );
  }
}

export function OverviewPage(): ReactElement {
  const core = useOverviewCore();
  const signals = useOverviewSignals();

  return (
    <PageShell
      title="Overview"
      description="Where you stand across every market, and whether everything is working."
      breadcrumbs={[{ label: 'Overview' }]}
    >
      {renderContent(core, signals)}
    </PageShell>
  );
}
