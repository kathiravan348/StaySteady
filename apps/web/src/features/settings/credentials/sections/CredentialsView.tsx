import { Button, Card, EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useRevertCredentialConfig, useSaveCredentialConfig } from '../../../../data/api';
import type { CredentialConfigEntryDto, CredentialConfigInput } from '../../../../data/schemas';
import { ConfigEntryList, VersionHistory } from '../../../../shared/config';
import { ROUTES } from '../../../../routes/routes';
import styles from '../../Settings.module.scss';
import type { UnregisteredReference } from '../model/credentialDraft';
import { ACCESS_LABELS, blankCredential, describeCredential } from '../model/credentialDraft';
import { CredentialForm } from './CredentialForm';

const NEW = '__new__';

// Output and input shapes are the same (no transforms), so the form gets a plain copy.
const asInput = (config: CredentialConfigInput): CredentialConfigInput => structuredClone(config);

function expiryText(entry: CredentialConfigEntryDto): string {
  const left = entry.daysToExpiry;
  if (left === null) return 'no expiry';
  if (left < 0) return `expired ${String(-left)} d ago`;
  return `expires in ${String(left)} d`;
}

export function CredentialsView({
  entries,
  unregistered,
}: {
  readonly entries: readonly CredentialConfigEntryDto[];
  readonly unregistered: readonly UnregisteredReference[];
}): ReactElement {
  const [selected, setSelected] = useState<string | null>(entries[0]?.config.reference ?? null);
  // Bumped to throw away unsaved edits: the form is keyed on it, so a new key starts it fresh.
  const [resets, setResets] = useState(0);
  const toggle = useSaveCredentialConfig();
  const revert = useRevertCredentialConfig();
  const entry = entries.find((item) => item.config.reference === selected);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.page}>
      {unregistered.length > 0 && (
        <div className={styles.errorSummary} role="alert">
          <p className={styles.warning}>
            {unregistered.length === 1
              ? '1 reference in use is not registered'
              : `${String(unregistered.length)} references in use are not registered`}
          </p>
          {unregistered.map((item) => (
            <p key={item.reference} className={styles.note}>
              {item.reference}, named by {item.users.join(', ')}. Nothing tracks its expiry or
              access; add it here.
            </p>
          ))}
          <span className={styles.inline}>
            <Link className={styles.link} to={ROUTES.SETTINGS_PROVIDERS}>
              Data providers
            </Link>
            <Link className={styles.link} to={ROUTES.SETTINGS_BROKERS}>
              Brokers
            </Link>
          </span>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.stack}>
          <div className={styles.toolbar}>
            <span className={styles.meta}>{entries.length} references</span>
            <Button
              variant="secondary"
              onPress={() => {
                setSelected(NEW);
              }}
            >
              Add reference
            </Button>
          </div>
          <ConfigEntryList
            label="Credential references"
            entries={entries.map((item) => ({
              id: item.config.reference,
              title: item.config.label,
              subtitle: `${item.config.reference} · ${ACCESS_LABELS[item.config.access]} · ${expiryText(item)} · v${String(item.versions[0]?.version ?? 1)}`,
              enabled: item.config.enabled,
              mode: item.config.mode,
              health: item.health,
            }))}
            selectedId={selected}
            isBusy={toggle.isPending}
            onSelect={setSelected}
            onToggleEnabled={(id, enabled) => {
              const target = entries.find((item) => item.config.reference === id);
              if (target === undefined) return;
              toggle.mutate({
                isNew: false,
                id,
                config: { ...asInput(target.config), enabled },
                reason: `${enabled ? 'Restored' : 'Revoked'} from the credential list.`,
              });
            }}
          />
          {toggle.isError && <p className={styles.warning}>{toggle.error.message}</p>}
        </div>

        <div className={styles.page}>
          {selected === NEW ? (
            <CredentialForm
              key={NEW}
              initial={blankCredential(today)}
              isNew
              usedBy={[]}
              onSaved={setSelected}
              onCancel={() => {
                setSelected(entries[0]?.config.reference ?? null);
              }}
            />
          ) : entry === undefined ? (
            <Card title="Credential reference">
              <EmptyState
                title="Pick a reference"
                description="Choose a reference to see where it is used and when it expires."
              />
            </Card>
          ) : (
            <>
              <CredentialForm
                key={`${entry.config.reference}-${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
                initial={asInput(entry.config)}
                isNew={false}
                usedBy={entry.usedBy}
                onSaved={setSelected}
                onCancel={() => {
                  setResets((count) => count + 1);
                }}
              />
              <VersionHistory
                key={entry.config.reference}
                versions={entry.versions.map((version) => ({
                  version: version.version,
                  savedAt: version.savedAt,
                  reason: version.reason,
                  description: describeCredential(asInput(version.snapshot)),
                }))}
                isBusy={revert.isPending}
                error={revert.isError ? revert.error.message : null}
                onRevert={(version, reason) => {
                  revert.mutate({ id: entry.config.reference, version, reason });
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
