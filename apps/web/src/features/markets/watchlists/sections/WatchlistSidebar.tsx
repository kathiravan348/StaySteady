import { Button, DropTarget } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { WatchlistDto } from '../../../../data/schemas';
import { formatSignedPercent, pluralize } from '../../../../shared/format';
import type { WatchlistSummary } from '../model/watchlistRows';
import styles from '../Watchlists.module.scss';

export const WATCHLIST_DRAG_TYPE = 'application/x-staysteady-instrument';

export interface WatchlistSidebarProps {
  readonly lists: readonly WatchlistDto[];
  readonly selectedId: string;
  readonly summaries: ReadonlyMap<string, WatchlistSummary>;
  readonly onSelect: (id: string) => void;
  readonly onDropInstruments: (toListId: string, instrumentIds: readonly string[]) => void;
  readonly onCreate: () => void;
}

// Lists double as drop targets: drag a row onto another list to move it there (UI spec 7.5).
export function WatchlistSidebar({
  lists,
  selectedId,
  summaries,
  onSelect,
  onDropInstruments,
  onCreate,
}: WatchlistSidebarProps): ReactElement {
  return (
    <nav className={styles.sidebar} aria-label="Watchlists">
      <ul className={styles.listNav}>
        {lists.map((list) => {
          const summary = summaries.get(list.id);
          const isSelected = list.id === selectedId;
          return (
            <li key={list.id}>
              <DropTarget
                dragType={WATCHLIST_DRAG_TYPE}
                ariaLabel={`Move dropped instruments to ${list.name}`}
                onDropKeys={(keys) => {
                  onDropInstruments(list.id, keys);
                }}
              >
                <button
                  type="button"
                  className={styles.listButton}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => {
                    onSelect(list.id);
                  }}
                >
                  <span className={styles.listName}>{list.name}</span>
                  <span className={styles.meta}>
                    {pluralize(list.instrumentIds.length, 'instrument')}
                    {summary?.averageMovePercent == null
                      ? ''
                      : ` · ▲${summary.up} ▼${summary.down} · avg ${formatSignedPercent(summary.averageMovePercent)}`}
                  </span>
                </button>
              </DropTarget>
            </li>
          );
        })}
      </ul>
      <Button variant="secondary" onPress={onCreate}>
        New watchlist
      </Button>
    </nav>
  );
}
