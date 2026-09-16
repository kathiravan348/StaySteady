import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertInstrumentTypeConfig, useSaveInstrumentTypeConfig } from '../../../../data/api';
import type {
  InstrumentTypeConfigEntryDto,
  InstrumentTypeConfigInput,
  MarketConfigEntryDto,
} from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import { instrumentTypeLabel } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import { describeInstrumentType } from '../model/instrumentDraft';
import { InstrumentTypeForm } from './InstrumentTypeForm';

// Output and input shapes are the same (no transforms), so the form gets a plain copy.
const asInput = (config: InstrumentTypeConfigInput): InstrumentTypeConfigInput =>
  structuredClone(config);

export function InstrumentTypesView({
  entries,
  markets,
}: {
  readonly entries: readonly InstrumentTypeConfigEntryDto[];
  readonly markets: readonly MarketConfigEntryDto[];
}): ReactElement {
  const [selected, setSelected] = useState<string | null>(entries[0]?.config.type ?? null);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveInstrumentTypeConfig();
  const revert = useRevertInstrumentTypeConfig();
  const entry = entries.find((item) => item.config.type === selected);
  const marketOptions = markets.map((item) => ({
    value: item.config.marketId,
    label: item.config.enabled ? item.config.marketId : `${item.config.marketId} (disabled)`,
  }));

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <span className={styles.meta}>
          {entries.length} instrument types. The list is fixed; each can be switched off.
        </span>
        <ConfigEntryList
          label="Instrument types"
          entries={entries.map((item) => ({
            id: item.config.type,
            title: instrumentTypeLabel(item.config.type),
            subtitle: `${item.config.markets.join(', ') || 'No markets'} · ${item.config.manualOnly ? 'manual only' : item.config.automationPermitted ? 'automation permitted' : 'approval needed'} · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: item.config.enabled,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={toggle.isPending}
          onSelect={setSelected}
          onToggleEnabled={(id, enabled) => {
            const target = entries.find((item) => item.config.type === id);
            if (target === undefined) return;
            toggle.mutate({
              isNew: false,
              id,
              config: { ...asInput(target.config), enabled },
              reason: `${enabled ? 'Enabled' : 'Disabled'} from the instrument type list.`,
            });
          }}
        />
        {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
      </div>

      <div className={styles.page}>
        {entry !== undefined && (
          <>
            <InstrumentTypeForm
              key={`${entry.config.type}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInput(entry.config)}
              marketOptions={marketOptions}
              onCancel={() => {
                setResets((count) => count + 1);
              }}
            />
            <VersionHistory
              key={entry.config.type}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeInstrumentType(asInput(version.snapshot)),
              }))}
              isBusy={revert.isPending}
              error={revert.isError ? revert.error.message : null}
              onRevert={(version, reason) => {
                revert.mutate({ id: entry.config.type, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
