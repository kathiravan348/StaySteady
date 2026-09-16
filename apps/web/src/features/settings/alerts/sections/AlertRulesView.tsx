import { Button, Card, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRevertAlertRuleConfig, useSaveAlertRuleConfig } from '../../../../data/api';
import type {
  AlertChannelDto,
  AlertRuleConfigEntryDto,
  AlertRuleConfigInput,
} from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import { humanizeToken } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import { blankAlertRule, describeAlertRule } from '../model/alertRuleDraft';
import { AlertRuleForm } from './AlertRuleForm';

const NEW = '__new__';

// Output and input shapes are the same (no transforms), so the form gets a plain copy.
const asInput = (config: AlertRuleConfigInput): AlertRuleConfigInput => structuredClone(config);

export function AlertRulesView({
  entries,
  channels,
}: {
  readonly entries: readonly AlertRuleConfigEntryDto[];
  readonly channels: readonly AlertChannelDto[];
}): ReactElement {
  const [selected, setSelected] = useState<string | null>(entries[0]?.config.ruleId ?? null);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveAlertRuleConfig();
  const revert = useRevertAlertRuleConfig();
  const entry = entries.find((item) => item.config.ruleId === selected);
  const channelName = (id: string): string =>
    channels.find((channel) => channel.id === id)?.name ?? id;
  const channelOptions = channels.map((channel) => ({
    value: channel.id,
    label:
      channel.lastTest === null
        ? `${channel.name} (never tested)`
        : channel.lastTest.result === 'failed'
          ? `${channel.name} (last test failed)`
          : channel.name,
  }));

  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <span className={styles.meta}>{entries.length} rules</span>
          <Button
            variant="secondary"
            onPress={() => {
              setSelected(NEW);
            }}
          >
            Add rule
          </Button>
        </div>
        <ConfigEntryList
          label="Alert rules"
          entries={entries.map((item) => ({
            id: item.config.ruleId,
            title: item.config.name,
            subtitle: `${humanizeToken(item.config.category)} · ${humanizeToken(item.config.minimumSeverity)} or worse · ${item.config.channels.map(channelName).join(', ')} · v${String(item.versions[0]?.version ?? 1)}`,
            enabled: item.config.enabled,
            health: item.health,
          }))}
          selectedId={selected}
          isBusy={toggle.isPending}
          onSelect={setSelected}
          onToggleEnabled={(id, enabled) => {
            const target = entries.find((item) => item.config.ruleId === id);
            if (target === undefined) return;
            toggle.mutate({
              isNew: false,
              id,
              config: { ...asInput(target.config), enabled },
              reason: `${enabled ? 'Enabled' : 'Disabled'} from the rule list.`,
            });
          }}
        />
        {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
      </div>

      <div className={styles.page}>
        {selected === NEW ? (
          <AlertRuleForm
            key={NEW}
            initial={blankAlertRule()}
            isNew
            channelOptions={channelOptions}
            onSaved={setSelected}
            onCancel={() => {
              setSelected(entries[0]?.config.ruleId ?? null);
            }}
          />
        ) : entry === undefined ? (
          <Card title="Alert rule">
            <EmptyState title="Pick a rule" description="Choose a rule to see and change it." />
          </Card>
        ) : (
          <>
            <AlertRuleForm
              key={`${entry.config.ruleId}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
              initial={asInput(entry.config)}
              isNew={false}
              channelOptions={channelOptions}
              onSaved={setSelected}
              onCancel={() => {
                setResets((count) => count + 1);
              }}
            />
            <VersionHistory
              key={entry.config.ruleId}
              versions={entry.versions.map((version) => ({
                version: version.version,
                savedAt: version.savedAt,
                reason: version.reason,
                description: describeAlertRule(asInput(version.snapshot), channelName),
              }))}
              isBusy={revert.isPending}
              error={revert.isError ? revert.error.message : null}
              onRevert={(version, reason) => {
                revert.mutate({ id: entry.config.ruleId, version, reason });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
