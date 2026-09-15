import type { ReactElement } from 'react';

import { useSystemState } from '../../../providers/SystemStateProvider';
import { ROUTES } from '../../../routes/routes';
import { formatMoney } from '../../../shared/format';
import { humanizeToken } from '../model/overviewLists';
import type { HeadlineFigures } from '../model/overviewTypes';
import styles from '../OverviewPage.module.scss';
import {
  directionOfNumber,
  formatSignedMoney,
  formatSignedPercent,
  pluralize,
} from '../overviewFormat';
import type { OverviewSignals } from '../useOverviewSignals';
import { LinkedMetricCard } from './LinkedMetricCard';

export interface HeadlineCardsProps {
  readonly headline: HeadlineFigures;
  readonly signals: OverviewSignals;
}

const UNAVAILABLE = '—';

export function HeadlineCards({ headline, signals }: HeadlineCardsProps): ReactElement {
  const { mode, isAutomationStopped } = useSystemState();
  const todayDirection = directionOfNumber(headline.todayChangePercent);

  return (
    <section className={styles.headline} aria-label="Headline figures">
      <LinkedMetricCard
        to={ROUTES.PORTFOLIO_HOLDINGS}
        label={`Total portfolio value (${headline.totalValue.currency})`}
        value={formatMoney(headline.totalValue)}
        changeValue={`${formatSignedPercent(headline.todayChangePercent)} today`}
        direction={todayDirection}
        subLabel={`Since inception ${formatSignedMoney(headline.unrealisedGain)} (${formatSignedPercent(headline.unrealisedGainPercent)})`}
      />
      <LinkedMetricCard
        to={ROUTES.PORTFOLIO_PERFORMANCE}
        label="Today's gain / loss"
        value={formatSignedMoney(headline.todayChange)}
        changeValue={formatSignedPercent(headline.todayChangePercent)}
        direction={todayDirection}
      />
      <LinkedMetricCard
        to={ROUTES.PORTFOLIO_TRANSACTIONS}
        label="Cash available"
        value={formatMoney(headline.cash)}
        subLabel={`${headline.deployedPercent.toFixed(1)}% of capital deployed`}
      />
      <LinkedMetricCard
        to={ROUTES.PORTFOLIO_HOLDINGS}
        label="Open positions"
        value={String(headline.openPositions)}
      />
      <LinkedMetricCard
        to={ROUTES.TRADING_APPROVALS}
        label="Automation"
        value={isAutomationStopped ? 'Halted' : humanizeToken(mode)}
        subLabel={
          signals.pendingApprovals === undefined
            ? `${UNAVAILABLE} pending approvals`
            : `${pluralize(signals.pendingApprovals, 'pending approval')}`
        }
      />
      <LinkedMetricCard
        to={ROUTES.HEALTH_STATUS}
        label="System health"
        value={
          signals.overallHealth === undefined ? UNAVAILABLE : humanizeToken(signals.overallHealth)
        }
        subLabel={
          signals.unhealthyComponents === undefined
            ? 'Status unavailable'
            : `${pluralize(signals.unhealthyComponents, 'component')} not healthy`
        }
      />
    </section>
  );
}
