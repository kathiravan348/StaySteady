import { Button, Card, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertProviderConfig, useSaveProviderConfig } from '../../../../data/api';
import type {
  MarketConfigEntryDto,
  ProviderConfigEntryDto,
  ProviderConfigInput,
} from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { blankProvider, dataKindLabel, describeProvider } from '../model/providerDraft';
import { ProviderForm } from './ProviderForm';

const NEW = '__new__';

// Provider output and input shapes are the same (no transforms), so the form gets a plain copy.
const asInput = (config: ProviderConfigInput): ProviderConfigInput => structuredClone(config);

export function ProvidersView({
  entries,
  markets,
}: {
  readonly entries: readonly ProviderConfigEntryDto[];
  readonly markets: readonly MarketConfigEntryDto[];
}): ReactElement {
  const [selected, setSelected] = useState<string | null>(entries[0]?.config.providerId ?? null);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveProviderConfig();
  const revert = useRevertProviderConfig();
  const entry = entries.find((item) => item.config.providerId === selected);
  const saved = entries.map((item) => asInput(item.config));
  const marketOptions = markets.map((item) => ({
    value: item.config.marketId,
    label: item.config.enabled ? item.config.marketId : `${item.config.marketId} (disabled)`,
  }));
  // Lowest priority number first, the order data is asked for.
  const ordered = [...entries].sort((a, b) => a.config.priority - b.config.priority);

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <span className={styles.meta}>{entries.length} providers, by priority</span>
          <Button
            variant="secondary"
            onPress={() => {
              setSelected(NEW);
            }}
          >
            Add provider
          </Button>
        </div>
        <ConfigEntryList
          label="Configured data providers"
          entries={ordered.map((item) => ({
            id: item.config.providerId,
            title: item.config.name,
            subtitle: `Priority ${String(item.config.priority)} · ${item.config.coverage.dataKinds.map(dataKindLabel).join(', ')} · ${item.config.coverage.markets.join(', ')} · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: item.config.enabled,
            mode: item.config.mode,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={toggle.isPending}
          onSelect={setSelected}
          onToggleEnabled={(id, enabled) => {
            const target = entries.find((item) => item.config.providerId === id);
            if (target === undefined) return;
            // Recorded like any other change, with a reason that says where it came from.
            toggle.mutate({
              isNew: false,
              config: { ...asInput(target.config), enabled },
              reason: `${enabled ? 'Enabled' : 'Disabled'} from the provider list.`,
            });
          }}
        />
        {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
      </div>

      <div className={styles.page}>
        {selected === NEW ? (
          <ProviderForm
            key={NEW}
            initial={blankProvider()}
            isNew
            saved={saved}
            marketOptions={marketOptions}
            onSaved={setSelected}
            onCancel={() => {
              setSelected(entries[0]?.config.providerId ?? null);
            }}
          />
        ) : entry === undefined ? (
          <Card title="Data provider">
            <EmptyState
              title="Pick a provider"
              description="Choose a data provider to see and change its configuration."
            />
          </Card>
        ) : (
          <>
            <ProviderForm
              key={`${entry.config.providerId}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInput(entry.config)}
              isNew={false}
              saved={saved}
              marketOptions={marketOptions}
              onSaved={setSelected}
              onCancel={() => {
                setResets((count) => count + 1);
              }}
            />
            <VersionHistory
              // Keyed per provider: an open comparison or revert belongs to that provider only.
              key={entry.config.providerId}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeProvider(asInput(version.snapshot)),
              }))}
              isBusy={revert.isPending}
              error={revert.isError ? revert.error.message : null}
              onRevert={(version, reason) => {
                revert.mutate({ providerId: entry.config.providerId, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
