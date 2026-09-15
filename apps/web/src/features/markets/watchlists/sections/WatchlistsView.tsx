import { Button, EmptyState, ReorderableList } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  useCreateWatchlist,
  useDeleteWatchlist,
  useMoveWatchlistInstrument,
  usePriceHistories,
  useQuotes,
  useRenameWatchlist,
  useSetWatchlistInstruments,
} from '../../../../data/api';
import type { InstrumentDto, MarketDto, WatchlistDto } from '../../../../data/schemas';
import { useMarketSchedule } from '../../../../providers/MarketScheduleProvider';
import type { MarketSessionState } from '../../../../shared/marketTime';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';
import { PriceFreshnessBar } from '../../../../shared/ui/PriceFreshnessBar';
import type { WatchlistSummary } from '../model/watchlistRows';
import {
  buildWatchlistRows,
  moveByOffset,
  reorderIds,
  summariseWatchlist,
} from '../model/watchlistRows';
import styles from '../Watchlists.module.scss';
import {
  DeleteWatchlistDialog,
  MoveInstrumentDialog,
  WatchlistNameDialog,
} from './WatchlistDialogs';
import { WatchlistHeader } from './WatchlistHeader';
import { QuickAddBar } from './QuickAddBar';
import { WatchlistRowView } from './WatchlistRowView';
import { WATCHLIST_DRAG_TYPE, WatchlistSidebar } from './WatchlistSidebar';

export interface WatchlistsViewProps {
  readonly lists: readonly WatchlistDto[];
  readonly instruments: readonly InstrumentDto[];
  readonly markets: readonly MarketDto[];
  readonly refreshError: string | null;
}

type OpenDialog =
  | { readonly kind: 'create' }
  | { readonly kind: 'rename' }
  | { readonly kind: 'delete' }
  | { readonly kind: 'move'; readonly instrumentId: string; readonly symbol: string }
  | null;

export function WatchlistsView({
  lists,
  instruments,
  markets,
  refreshError,
}: WatchlistsViewProps): ReactElement {
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const create = useCreateWatchlist();
  const rename = useRenameWatchlist();
  const remove = useDeleteWatchlist();
  const setInstruments = useSetWatchlistInstruments();
  const move = useMoveWatchlistInstrument();
  const { marketStatuses } = useMarketSchedule();

  const selected = lists.find((list) => list.id === params.get('list')) ?? lists[0];
  const select = (id: string): void => {
    setParams({ list: id }, { replace: true });
  };

  const allIds = useMemo(
    () => [...new Set(lists.flatMap((list) => list.instrumentIds.map(String)))],
    [lists],
  );
  const quotes = useQuotes(allIds);
  const selectedIds = useMemo(() => selected?.instrumentIds.map(String) ?? [], [selected]);
  const histories = usePriceHistories(selectedIds);
  const marketStates = useMemo(
    () =>
      new Map<string, MarketSessionState>(
        marketStatuses.map((status) => [status.marketId, status.state]),
      ),
    [marketStatuses],
  );

  const summaries = useMemo(
    () =>
      new Map<string, WatchlistSummary>(
        lists.map((list) => [list.id, summariseWatchlist(list.instrumentIds, quotes.data ?? [])]),
      ),
    [lists, quotes.data],
  );
  const rows = useMemo(
    () =>
      selected === undefined
        ? []
        : buildWatchlistRows(selected, {
            instruments,
            markets,
            quotes: quotes.data ?? [],
            histories: histories.histories,
            marketStates,
          }),
    [selected, instruments, markets, quotes.data, histories.histories, marketStates],
  );
  const heldMarketIds = useMemo(() => new Set(rows.map((row) => row.instrument.marketId)), [rows]);
  const oldestQuote = rows.reduce<IsoUtcTimestamp | null>(
    (oldest, row) =>
      row.quoteTimestamp !== null && (oldest === null || row.quoteTimestamp < oldest)
        ? row.quoteTimestamp
        : oldest,
    null,
  );

  const mutationError =
    [setInstruments, move, remove].find((mutation) => mutation.isError)?.error?.message ?? null;
  const closeDialog = (): void => {
    setDialog(null);
    create.reset();
    rename.reset();
    remove.reset();
    move.reset();
  };

  if (selected === undefined) {
    return (
      <>
        <EmptyState
          title="No watchlists yet"
          description="Create a watchlist to follow instruments across markets and types."
          action={<Button onPress={() => setDialog({ kind: 'create' })}>Create a watchlist</Button>}
        />
        {dialog?.kind === 'create' && (
          <WatchlistNameDialog
            title="New watchlist"
            submitLabel="Create"
            initialName=""
            isBusy={create.isPending}
            serverError={create.error?.message ?? null}
            onClose={closeDialog}
            onSubmit={(name) =>
              create.mutate(name, {
                onSuccess: (next) => {
                  select(next[next.length - 1]?.id ?? '');
                  closeDialog();
                },
              })
            }
          />
        )}
      </>
    );
  }

  const ids = selected.instrumentIds.map(String);
  const saveOrder = (instrumentIds: readonly string[]): void => {
    setInstruments.mutate({ id: selected.id, instrumentIds });
  };
  const otherLists = lists.filter((list) => list.id !== selected.id);

  return (
    <div className={styles.layout}>
      <WatchlistSidebar
        lists={lists}
        selectedId={selected.id}
        summaries={summaries}
        onSelect={select}
        onCreate={() => setDialog({ kind: 'create' })}
        onDropInstruments={(toListId, instrumentIds) => {
          if (toListId === selected.id) return;
          instrumentIds.forEach((instrumentId) =>
            move.mutate({ instrumentId, fromWatchlistId: selected.id, toWatchlistId: toListId }),
          );
        }}
      />
      <div className={styles.main}>
        <PriceFreshnessBar oldestQuoteTimestamp={oldestQuote} heldMarketIds={heldMarketIds} />
        {(refreshError !== null || quotes.isError) && (
          <p className={styles.error} role="alert">
            Could not refresh {refreshError === null ? 'live prices' : 'watchlists'}; showing the
            last data received. {refreshError ?? quotes.error?.message}
          </p>
        )}
        <WatchlistHeader
          list={selected}
          summary={summaries.get(selected.id) ?? summariseWatchlist(selected.instrumentIds, [])}
          onRename={() => setDialog({ kind: 'rename' })}
          onDelete={() => setDialog({ kind: 'delete' })}
        />
        <QuickAddBar
          listName={selected.name}
          instruments={instruments}
          markets={markets}
          existingIds={ids}
          isBusy={setInstruments.isPending}
          onAdd={(instrumentId) => saveOrder([...ids, instrumentId])}
        />
        {mutationError !== null && (
          <p className={styles.error} role="alert">
            Change not saved: {mutationError}
          </p>
        )}
        <p className={styles.meta}>
          Drag a row by its handle to reorder, or onto a list on the left to move it. With a
          keyboard, press Enter on a handle, Tab to a position and press Enter to drop.
        </p>
        <ReorderableList
          items={rows}
          getKey={(row) => row.id}
          getTextValue={(row) => `${row.instrument.symbol} ${row.instrument.name}`}
          ariaLabel={`${selected.name} instruments`}
          dragType={WATCHLIST_DRAG_TYPE}
          onReorder={(moved, target, position) =>
            saveOrder(reorderIds(ids, moved, target, position))
          }
          renderEmptyState={() => (
            <div className={styles.emptyList}>
              This list is empty. Search above to add instruments.
            </div>
          )}
          renderItem={(row) => (
            <WatchlistRowView
              row={row}
              isFirst={ids[0] === row.id}
              isLast={ids[ids.length - 1] === row.id}
              canMoveToOtherList={otherLists.length > 0}
              onMoveUp={() => saveOrder(moveByOffset(ids, row.id, -1))}
              onMoveDown={() => saveOrder(moveByOffset(ids, row.id, 1))}
              onMoveToList={() =>
                setDialog({ kind: 'move', instrumentId: row.id, symbol: row.instrument.symbol })
              }
              onRemove={() => saveOrder(ids.filter((id) => id !== row.id))}
            />
          )}
        />
      </div>

      {dialog?.kind === 'create' && (
        <WatchlistNameDialog
          title="New watchlist"
          submitLabel="Create"
          initialName=""
          isBusy={create.isPending}
          serverError={create.error?.message ?? null}
          onClose={closeDialog}
          onSubmit={(name) =>
            create.mutate(name, {
              onSuccess: (next) => {
                select(next[next.length - 1]?.id ?? selected.id);
                closeDialog();
              },
            })
          }
        />
      )}
      {dialog?.kind === 'rename' && (
        <WatchlistNameDialog
          title={`Rename ${selected.name}`}
          submitLabel="Save name"
          initialName={selected.name}
          isBusy={rename.isPending}
          serverError={rename.error?.message ?? null}
          onClose={closeDialog}
          onSubmit={(name) => rename.mutate({ id: selected.id, name }, { onSuccess: closeDialog })}
        />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteWatchlistDialog
          list={selected}
          isBusy={remove.isPending}
          serverError={remove.error?.message ?? null}
          onClose={closeDialog}
          onConfirm={() =>
            remove.mutate(selected.id, {
              onSuccess: (next) => {
                if (next[0] !== undefined) select(next[0].id);
                closeDialog();
              },
            })
          }
        />
      )}
      {dialog?.kind === 'move' && (
        <MoveInstrumentDialog
          symbol={dialog.symbol}
          lists={otherLists}
          isBusy={move.isPending}
          serverError={move.error?.message ?? null}
          onClose={closeDialog}
          onMove={(toWatchlistId) =>
            move.mutate(
              { instrumentId: dialog.instrumentId, fromWatchlistId: selected.id, toWatchlistId },
              { onSuccess: closeDialog },
            )
          }
        />
      )}
    </div>
  );
}
