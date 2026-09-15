import { Badge, Button } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { WatchlistDto } from '../../../../data/schemas';
import { formatSignedPercent, pluralize } from '../../../../shared/format';
import type { WatchlistSummary } from '../model/watchlistRows';
import styles from '../Watchlists.module.scss';

export interface WatchlistHeaderProps {
  readonly list: WatchlistDto;
  readonly summary: WatchlistSummary;
  readonly onRename: () => void;
  readonly onDelete: () => void;
}

// UI spec 7.5 — per-list summary: how many are up, down, and the average move today.
export function WatchlistHeader({
  list,
  summary,
  onRename,
  onDelete,
}: WatchlistHeaderProps): ReactElement {
  const average = summary.averageMovePercent;
  return (
    <div className={styles.header}>
      <div className={styles.stack}>
        <h2 className={styles.listTitle}>{list.name}</h2>
        <div className={styles.badges} aria-label="Today's summary">
          <Badge variant="neutral">{pluralize(summary.count, 'instrument')}</Badge>
          <Badge variant="positive">▲ {summary.up} up</Badge>
          <Badge variant="negative">▼ {summary.down} down</Badge>
          {summary.flat > 0 && <Badge variant="neutral">■ {summary.flat} flat</Badge>}
          <Badge
            variant={
              average === null
                ? 'neutral'
                : average > 0
                  ? 'positive'
                  : average < 0
                    ? 'negative'
                    : 'neutral'
            }
          >
            Average move {average === null ? 'unavailable' : formatSignedPercent(average)}
          </Badge>
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onPress={onRename}>
          Rename
        </Button>
        <Button variant="danger" size="sm" onPress={onDelete}>
          Delete list
        </Button>
      </div>
    </div>
  );
}
