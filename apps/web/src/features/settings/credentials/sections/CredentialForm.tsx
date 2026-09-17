import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveCredentialConfig } from '../../../../data/api';
import type { CredentialConfigInput, CredentialUserDto } from '../../../../data/schemas';
import { CredentialConfigSchema } from '../../../../data/schemas';
import {
  CapabilitySwitch,
  ConfigSaveCard,
  DateField,
  NumberField,
  SelectField,
  SimulationNotice,
  TextField,
  useConfigDraft,
} from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { ACCESS_OPTIONS } from '../model/credentialDraft';

export interface CredentialFormProps {
  readonly initial: CredentialConfigInput;
  readonly isNew: boolean;
  readonly usedBy: readonly CredentialUserDto[];
  readonly onSaved: (reference: string) => void;
  readonly onCancel: () => void;
}

const MODE_OPTIONS = [
  { value: 'simulation' as const, label: 'Simulation' },
  { value: 'live' as const, label: 'Live' },
];

// UI spec 7.18 — the detail form for a credential reference. There is deliberately no field for the
// secret: it is put in the credential store directly, and only its reference is kept here.
export function CredentialForm({
  initial,
  isNew,
  usedBy,
  onSaved,
  onCancel,
}: CredentialFormProps): ReactElement {
  const save = useSaveCredentialConfig();
  const form = useConfigDraft(initial, CredentialConfigSchema);
  const { draft, update, error } = form;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>
            {isNew ? 'New credential reference' : initial.label}
          </strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>
      {isNew && <SimulationNotice subject="credential" />}

      <Card title="Reference">
        <div className={styles.stack}>
          <p className={styles.note}>
            The secret itself is never entered, stored or shown here. Put it in the credential
            store, then record where it is so providers and brokers can name it.
          </p>
          <div className={styles.fieldGrid}>
            <TextField
              label="Credential store reference"
              hint={
                isNew
                  ? 'Such as vault://simulation/brokers/name. It cannot change once saved.'
                  : 'Fixed once saved; add a new entry to move to another reference.'
              }
              value={draft.reference}
              isDisabled={!isNew}
              error={error('reference')}
              onChange={(value) => {
                update('reference', (current) => ({ ...current, reference: value.trim() }));
              }}
            />
            <TextField
              label="What it is for"
              value={draft.label}
              error={error('label')}
              onChange={(value) => {
                update('label', (current) => ({ ...current, label: value }));
              }}
            />
            <TextField
              label="Where the secret is kept"
              value={draft.storedIn}
              error={error('storedIn')}
              onChange={(value) => {
                update('storedIn', (current) => ({ ...current, storedIn: value }));
              }}
            />
          </div>
        </div>
      </Card>

      <Card title="What it may do">
        <div className={styles.fieldGrid}>
          <SelectField
            label="Mode"
            value={draft.mode}
            options={MODE_OPTIONS}
            error={error('mode')}
            onChange={(value) => {
              update('mode', (current) => ({ ...current, mode: value }));
            }}
          />
          <SelectField
            label="Access"
            value={draft.access}
            options={ACCESS_OPTIONS}
            error={error('access')}
            onChange={(value) => {
              update('access', (current) => ({ ...current, access: value }));
            }}
          />
        </div>
        <p className={styles.meta}>
          Simulation and live credentials are kept apart: a simulation reference has a /simulation/
          segment and a live one never does. Use read-only access unless something places orders
          with it.
        </p>
        <CapabilitySwitch
          label="Enabled"
          description="Off means revoked: anything that names this reference can no longer connect."
          isSelected={draft.enabled}
          onChange={(value) => {
            update('enabled', (current) => ({ ...current, enabled: value }));
          }}
        />
      </Card>

      <Card title="Expiry">
        <div className={styles.stack}>
          <label className={styles.checkOption}>
            <input
              type="checkbox"
              checked={draft.expiresOn === null}
              onChange={(event) => {
                update('expiresOn', (current) => ({
                  ...current,
                  expiresOn: event.target.checked ? null : current.issuedOn,
                }));
              }}
            />
            Does not expire
          </label>
          <div className={styles.fieldGrid}>
            <DateField
              label="Issued on"
              value={draft.issuedOn}
              error={error('issuedOn')}
              onChange={(value) => {
                update('issuedOn', (current) => ({ ...current, issuedOn: value }));
              }}
            />
            {draft.expiresOn !== null && (
              <DateField
                label="Expires on"
                value={draft.expiresOn}
                error={error('expiresOn')}
                onChange={(value) => {
                  update('expiresOn', (current) => ({ ...current, expiresOn: value }));
                }}
              />
            )}
            <NumberField
              label="Warn this many days before"
              step="1"
              value={draft.warnDaysBefore}
              error={error('warnDaysBefore')}
              onChange={(value) => {
                update('warnDaysBefore', (current) => ({ ...current, warnDaysBefore: value }));
              }}
            />
          </div>
        </div>
      </Card>

      {!isNew && (
        <Card title="Used by">
          {usedBy.length === 0 ? (
            <p className={styles.note}>No provider or broker names this reference.</p>
          ) : (
            <ul className={styles.rowList}>
              {usedBy.map((user) => (
                <li key={`${user.kind}-${user.id}`} className={styles.inline}>
                  <span className={styles.note}>{user.name}</span>
                  <Badge variant="neutral">
                    {user.kind === 'broker' ? 'Broker' : 'Data provider'}
                  </Badge>
                  <Badge variant={user.mode === 'live' ? 'info' : 'neutral'}>
                    {user.mode === 'live' ? 'Live' : 'Simulation'}
                  </Badge>
                  {user.needsTrading && <Badge variant="neutral">Places orders</Badge>}
                  {!user.enabled && <Badge variant="neutral">Disabled</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <ConfigSaveCard
        title={isNew ? 'Add this reference' : 'Save changes'}
        form={form}
        isNew={isNew}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel={isNew ? 'Add reference' : 'Save as a new version'}
        onSave={(reason) => {
          save.mutate(
            { isNew, id: draft.reference, config: draft, reason },
            {
              onSuccess: () => {
                onSaved(draft.reference);
              },
            },
          );
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
