import { Badge } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useSaveProviderConfig, useTestProviderConnection } from '../../../../data/api';
import type { ProviderConfigInput } from '../../../../data/schemas';
import { ProviderConfigSchema } from '../../../../data/schemas';
import {
  ConfigSaveCard,
  ConnectionTest,
  SimulationNotice,
  useConfigDraft,
} from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { ProviderCoverageSection, ProviderIdentitySection } from './ProviderCoverage';
import {
  ProviderAccessSection,
  ProviderCapabilitiesSection,
  ProviderLimitsSection,
  ProviderPrioritySection,
} from './ProviderOperations';

export interface ProviderFormProps {
  readonly initial: ProviderConfigInput;
  readonly isNew: boolean;
  readonly saved: readonly ProviderConfigInput[];
  readonly marketOptions: readonly { value: string; label: string }[];
  readonly onSaved: (providerId: string) => void;
  readonly onCancel: () => void;
}

// UI spec 7.18 — the detail form for adding or editing a data provider, validated inline with the
// schema the server saves with, and testable before it is saved.
export function ProviderForm({
  initial,
  isNew,
  saved,
  marketOptions,
  onSaved,
  onCancel,
}: ProviderFormProps): ReactElement {
  const save = useSaveProviderConfig();
  const test = useTestProviderConnection();
  const form = useConfigDraft(initial, ProviderConfigSchema);
  const { draft } = form;
  // The draft a result was taken for, so a later edit marks the result as possibly out of date.
  const [testedDraft, setTestedDraft] = useState<string | null>(null);
  const sectionProps = { draft, isNew, update: form.update, error: form.error };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>
            {isNew ? 'New data provider' : `${initial.name} (${initial.providerId})`}
          </strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      {isNew && <SimulationNotice subject="provider" />}

      <ProviderIdentitySection {...sectionProps} />
      <ProviderCoverageSection {...sectionProps} marketOptions={marketOptions} />
      <ProviderLimitsSection {...sectionProps} />
      <ProviderPrioritySection {...sectionProps} saved={saved} />
      <ProviderAccessSection {...sectionProps} />
      <ProviderCapabilitiesSection {...sectionProps} />

      <ConnectionTest
        result={test.data}
        isTesting={test.isPending}
        error={test.isError ? test.error.message : null}
        blockedReason={
          form.errorCount > 0
            ? 'Fix the fields marked in the form before testing; an invalid setting cannot be tested.'
            : null
        }
        isOutdated={testedDraft !== null && testedDraft !== JSON.stringify(draft)}
        onTest={() => {
          setTestedDraft(JSON.stringify(draft));
          test.mutate(draft);
        }}
      />

      <ConfigSaveCard
        title={isNew ? 'Add this provider' : 'Save changes'}
        form={form}
        isNew={isNew}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel={isNew ? 'Add provider in simulation' : 'Save as a new version'}
        onSave={(reason) => {
          save.mutate(
            { isNew, config: draft, reason },
            {
              onSuccess: () => {
                onSaved(draft.providerId);
              },
            },
          );
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
