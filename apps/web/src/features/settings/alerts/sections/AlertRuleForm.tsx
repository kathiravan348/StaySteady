import { Badge } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useSaveAlertRuleConfig, useTestAlertRule } from '../../../../data/api';
import type { AlertRuleConfigInput } from '../../../../data/schemas';
import { AlertRuleConfigSchema } from '../../../../data/schemas';
import { ConfigSaveCard, ConnectionTest, useConfigDraft } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { AlertRuleMatchSection, AlertRuleTimingSection } from './AlertRuleSections';

export interface AlertRuleFormProps {
  readonly initial: AlertRuleConfigInput;
  readonly isNew: boolean;
  readonly channelOptions: readonly { value: string; label: string }[];
  readonly onSaved: (ruleId: string) => void;
  readonly onCancel: () => void;
}

// UI spec 7.18 — the detail form for adding or editing an alert rule, with a test alert to its channels.
export function AlertRuleForm({
  initial,
  isNew,
  channelOptions,
  onSaved,
  onCancel,
}: AlertRuleFormProps): ReactElement {
  const save = useSaveAlertRuleConfig();
  const test = useTestAlertRule();
  const form = useConfigDraft(initial, AlertRuleConfigSchema);
  const { draft } = form;
  const [testedDraft, setTestedDraft] = useState<string | null>(null);
  const sectionProps = {
    draft,
    isNew,
    update: form.update,
    error: form.error,
    channelOptions,
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>{isNew ? 'New alert rule' : initial.name}</strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      <AlertRuleMatchSection {...sectionProps} />
      <AlertRuleTimingSection {...sectionProps} />

      <ConnectionTest
        title="Send a test alert"
        actionLabel="Send test alert"
        description="Sends a test to every channel in this rule, escalation channels included. It is marked as a test and does not escalate."
        result={test.data}
        isTesting={test.isPending}
        error={test.isError ? test.error.message : null}
        blockedReason={
          form.errorCount > 0 ? 'Fix the fields marked in the form before sending a test.' : null
        }
        isOutdated={testedDraft !== null && testedDraft !== JSON.stringify(draft)}
        onTest={() => {
          setTestedDraft(JSON.stringify(draft));
          test.mutate(draft);
        }}
      />

      <ConfigSaveCard
        title={isNew ? 'Add this rule' : 'Save changes'}
        form={form}
        isNew={isNew}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel={isNew ? 'Add rule' : 'Save as a new version'}
        onSave={(reason) => {
          save.mutate(
            { isNew, id: draft.ruleId, config: draft, reason },
            {
              onSuccess: () => {
                onSaved(draft.ruleId);
              },
            },
          );
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
