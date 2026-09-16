import { Button, Card, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertBrokerConfig, useSaveBrokerConfig } from '../../../../data/api';
import type {
  BrokerConfigEntryDto,
  BrokerConfigInput,
  MarketConfigEntryDto,
} from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { blankBroker, describeBroker } from '../model/brokerDraft';
import { BrokerForm } from './BrokerForm';

const NEW = '__new__';

// Broker output and input shapes are the same (no transforms), so the form gets a plain copy.
const asInput = (config: BrokerConfigInput): BrokerConfigInput => structuredClone(config);

export function BrokersView({
  entries,
  markets,
}: {
  readonly entries: readonly BrokerConfigEntryDto[];
  readonly markets: readonly MarketConfigEntryDto[];
}): ReactElement {
  const [selected, setSelected] = useState<string | null>(entries[0]?.config.brokerId ?? null);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveBrokerConfig();
  const revert = useRevertBrokerConfig();
  const entry = entries.find((item) => item.config.brokerId === selected);
  const marketOptions = markets.map((item) => ({
    value: item.config.marketId,
    label: item.config.enabled ? item.config.marketId : `${item.config.marketId} (disabled)`,
  }));
  const marketsWithoutAutomation = markets
    .filter((item) => !item.config.automationPermitted)
    .map((item) => item.config.marketId);

  const formProps = {
    marketOptions,
    marketsWithoutAutomation,
    onSaved: setSelected,
  };

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <span className={styles.meta}>{entries.length} brokers</span>
          <Button
            variant="secondary"
            onPress={() => {
              setSelected(NEW);
            }}
          >
            Add broker
          </Button>
        </div>
        <ConfigEntryList
          label="Configured brokers"
          entries={entries.map((item) => ({
            id: item.config.brokerId,
            title: item.config.name,
            subtitle: `${item.config.connection === 'api' ? 'API' : 'Manual'} · ${item.config.markets.join(', ')} · ${item.config.accountCurrency} · ${item.config.automationTypes.length === 0 ? 'no automation' : `automation for ${String(item.config.automationTypes.length)} types`} · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: item.config.enabled,
            mode: item.config.mode,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={toggle.isPending}
          onSelect={setSelected}
          onToggleEnabled={(id, enabled) => {
            const target = entries.find((item) => item.config.brokerId === id);
            if (target === undefined) return;
            // Recorded like any other change, with a reason that says where it came from.
            toggle.mutate({
              isNew: false,
              config: { ...asInput(target.config), enabled },
              reason: `${enabled ? 'Enabled' : 'Disabled'} from the broker list.`,
            });
          }}
        />
        {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
      </div>

      <div className={styles.page}>
        {selected === NEW ? (
          <BrokerForm
            key={NEW}
            initial={blankBroker()}
            isNew
            {...formProps}
            onCancel={() => {
              setSelected(entries[0]?.config.brokerId ?? null);
            }}
          />
        ) : entry === undefined ? (
          <Card title="Broker">
            <EmptyState
              title="Pick a broker"
              description="Choose a broker to see and change its configuration."
            />
          </Card>
        ) : (
          <>
            <BrokerForm
              key={`${entry.config.brokerId}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInput(entry.config)}
              isNew={false}
              {...formProps}
              onCancel={() => {
                setResets((count) => count + 1);
              }}
            />
            <VersionHistory
              // Keyed per broker: an open comparison or revert belongs to that broker only.
              key={entry.config.brokerId}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeBroker(asInput(version.snapshot)),
              }))}
              isBusy={revert.isPending}
              error={revert.isError ? revert.error.message : null}
              onRevert={(version, reason) => {
                revert.mutate({ brokerId: entry.config.brokerId, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
