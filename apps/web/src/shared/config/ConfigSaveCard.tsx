import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import styles from './Config.module.scss';
import type { ConfigDraft } from './useConfigDraft';

export interface ConfigSaveCardProps {
  readonly title: string;
  // Only the parts that do not depend on the area's data shape.
  readonly form: Pick<
    ConfigDraft<unknown>,
    'errors' | 'errorCount' | 'isDirty' | 'submitted' | 'reason' | 'setReason' | 'attemptSave'
  >;
  readonly isNew: boolean;
  readonly isSaving: boolean;
  readonly saveError: string | null;
  readonly saveLabel: string;
  readonly onSave: (reason: string) => void;
  readonly onCancel: () => void;
}

// UI spec 7.18 — the end of every configuration form: what still blocks the save, the reason kept
// with the version, and save or discard.
export function ConfigSaveCard({
  title,
  form,
  isNew,
  isSaving,
  saveError,
  saveLabel,
  onSave,
  onCancel,
}: ConfigSaveCardProps): ReactElement {
  const missingReason = form.submitted && form.reason.trim() === '';
  return (
    <Card title={title}>
      <div className={styles.stack}>
        {form.submitted && form.errorCount > 0 && (
          <div className={styles.errorSummary} role="alert">
            <p className={styles.warning}>
              {form.errorCount === 1
                ? '1 field needs fixing'
                : `${String(form.errorCount)} fields need fixing`}{' '}
              before this can be saved.
            </p>
            <ul className={styles.list}>
              {Object.entries(form.errors).map(([path, message]) => (
                <li key={path} className={styles.meta}>
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Reason for this change (kept with the version)</span>
          <input
            className={styles.input}
            value={form.reason}
            aria-invalid={missingReason}
            onChange={(event) => {
              form.setReason(event.target.value);
            }}
          />
        </label>
        {missingReason && <p className={styles.warning}>Say why this is changing.</p>}
        {saveError !== null && <p className={styles.warning}>{saveError}</p>}
        <span className={styles.inline}>
          <Button
            isDisabled={!isNew && !form.isDirty}
            isLoading={isSaving}
            onPress={() => {
              const reason = form.attemptSave();
              if (reason !== null) onSave(reason);
            }}
          >
            {saveLabel}
          </Button>
          <Button variant="secondary" isDisabled={isSaving} onPress={onCancel}>
            {isNew ? 'Cancel' : 'Discard changes'}
          </Button>
        </span>
      </div>
    </Card>
  );
}
