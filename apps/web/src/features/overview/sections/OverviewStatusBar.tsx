import { Badge, StaleState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useMarketSchedule } from '../../../providers/MarketScheduleProvider';
import { formatDateTime, formatRelativeTime } from '../../../shared/format';
import type { IsoUtcTimestamp } from '../../../shared/types/dateTime';
import styles from '../OverviewPage.module.scss';

export interface OverviewStatusBarProps {
  readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
  readonly heldMarketIds: ReadonlySet<string>;
}

// UI spec 10 — stale prices carry an explicit age; closed markets show prices as the last close.
const STALE_AFTER_MS = 5 * 60_000;

export function OverviewStatusBar({
  oldestQuoteTimestamp,
  heldMarketIds,
}: OverviewStatusBarProps): ReactElement | null {
  const { marketStatuses } = useMarketSchedule();
  const heldStatuses = marketStatuses.filter((status) => heldMarketIds.has(status.marketId));
  const closed = heldStatuses.filter(
    (status) => status.state === 'closed' || status.state === 'holiday',
  );
  const staleSince =
    oldestQuoteTimestamp !== null && Date.now() - Date.parse(oldestQuoteTimestamp) > STALE_AFTER_MS
      ? oldestQuoteTimestamp
      : null;

  if (staleSince === null && closed.length === 0) {
    return null;
  }

  const closedText =
    closed.length === heldStatuses.length
      ? 'All markets you hold are closed. Prices shown are the last close.'
      : `${closed.map((status) => status.name).join(', ')} closed. Prices there are the last close.`;

  return (
    <div className={styles.statusBar}>
      {staleSince !== null && (
        <StaleState
          isBanner
          ageText={formatRelativeTime(staleSince)}
          lastUpdated={formatDateTime(staleSince)}
        />
      )}
      {closed.length > 0 && <Badge variant="neutral">{closedText}</Badge>}
    </div>
  );
}
