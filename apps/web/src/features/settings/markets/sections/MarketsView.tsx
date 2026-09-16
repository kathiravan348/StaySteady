import { Button, Card, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertMarketConfig, useSaveMarketConfig } from '../../../../data/api';
import type { MarketConfigEntryDto, MarketConfigInput } from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { blankMarket, describeMarket } from '../model/marketDraft';
import { MarketForm } from './MarketForm';

const NEW = '__new__';

// The server returns parsed output; the form edits the input shape, which for markets is the same
// data with branded ids and dates as plain strings.
const asInput = (entry: MarketConfigEntryDto): MarketConfigInput =>
  JSON.parse(JSON.stringify(entry.config)) as MarketConfigInput;

export function MarketsView({
  entries,
}: {
  readonly entries: readonly MarketConfigEntryDto[];
}): ReactElement {
  const [selected, setSelected] = useState<string | null>(entries[0]?.config.marketId ?? null);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveMarketConfig();
  const revert = useRevertMarketConfig();
  const entry = entries.find((item) => item.config.marketId === selected);

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <span className={styles.meta}>{entries.length} markets</span>
          <Button
            variant="secondary"
            onPress={() => {
              setSelected(NEW);
            }}
          >
            Add market
          </Button>
        </div>
        <ConfigEntryList
          label="Configured markets"
          entries={entries.map((item) => ({
            id: item.config.marketId,
            title: `${item.config.name} (${item.config.marketId})`,
            subtitle: `${item.config.exchangeName} · ${item.config.currency} · T+${String(item.config.settlementDays)} · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: item.config.enabled,
            mode: item.config.mode,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={toggle.isPending}
          onSelect={setSelected}
          onToggleEnabled={(id, enabled) => {
            const target = entries.find((item) => item.config.marketId === id);
            if (target === undefined) return;
            // Recorded like any other change, with a reason that says where it came from.
            toggle.mutate({
              isNew: false,
              config: { ...asInput(target), enabled },
              reason: `${enabled ? 'Enabled' : 'Disabled'} from the market list.`,
            });
          }}
        />
        {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
      </div>

      <div className={styles.page}>
        {selected === NEW ? (
          <MarketForm
            key={NEW}
            initial={blankMarket()}
            isNew
            onSaved={setSelected}
            onCancel={() => {
              setSelected(entries[0]?.config.marketId ?? null);
            }}
          />
        ) : entry === undefined ? (
          <Card title="Market">
            <EmptyState
              title="Pick a market"
              description="Choose a market to see and change its configuration."
            />
          </Card>
        ) : (
          <>
            <MarketForm
              key={`${entry.config.marketId}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInput(entry)}
              isNew={false}
              onSaved={setSelected}
              onCancel={() => {
                setResets((count) => count + 1);
              }}
            />
            <VersionHistory
              // Keyed per market: an open comparison or revert belongs to that market's history only.
              key={entry.config.marketId}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeMarket(
                  JSON.parse(JSON.stringify(version.snapshot)) as MarketConfigInput,
                ),
              }))}
              isBusy={revert.isPending}
              error={revert.isError ? revert.error.message : null}
              onRevert={(version, reason) => {
                revert.mutate({ marketId: entry.config.marketId, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
