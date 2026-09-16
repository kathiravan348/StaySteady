import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useSaveBrokerConfig, useTestBrokerConnection } from '../../../../data/api';
import type { BrokerConfigInput } from '../../../../data/schemas';
import { BrokerConfigSchema } from '../../../../data/schemas';
import {
  ConfigSaveCard,
  ConnectionTest,
  SimulationNotice,
  useConfigDraft,
} from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { BrokerAccountSection, BrokerCoverageSection } from './BrokerAccount';
import { BrokerAccessSection, BrokerCapabilitiesSection, BrokerFeesSection } from './BrokerTrading';

export interface BrokerFormProps {
  readonly initial: BrokerConfigInput;
  readonly isNew: boolean;
  readonly marketOptions: readonly { value: string; label: string }[];
  // Markets whose own configuration does not permit automation.
  readonly marketsWithoutAutomation: readonly string[];
  readonly onSaved: (brokerId: string) => void;
  readonly onCancel: () => void;
}

// UI spec 7.18 — the detail form for adding or editing a broker, validated inline with the schema the
// server saves with. A connected broker can be tested; the test never touches orders.
export function BrokerForm({
  initial,
  isNew,
  marketOptions,
  marketsWithoutAutomation,
  onSaved,
  onCancel,
}: BrokerFormProps): ReactElement {
  const save = useSaveBrokerConfig();
  const test = useTestBrokerConnection();
  const form = useConfigDraft(initial, BrokerConfigSchema);
  const { draft } = form;
  // The draft a result was taken for, so a later edit marks the result as possibly out of date.
  const [testedDraft, setTestedDraft] = useState<string | null>(null);
  const sectionProps = { draft, isNew, update: form.update, error: form.error };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>
            {isNew ? 'New broker' : `${initial.name} (${initial.brokerId})`}
          </strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      {isNew && <SimulationNotice subject="broker" />}

      <BrokerAccountSection {...sectionProps} />
      <BrokerCoverageSection {...sectionProps} marketOptions={marketOptions} />
      <BrokerCapabilitiesSection {...sectionProps} />
      <BrokerFeesSection {...sectionProps} />
      <BrokerAccessSection
        {...sectionProps}
        automationBlockedMarkets={draft.markets.filter((market) =>
          marketsWithoutAutomation.includes(market),
        )}
      />

      {draft.connection === 'api' ? (
        <ConnectionTest
          result={test.data}
          isTesting={test.isPending}
          error={test.isError ? test.error.message : null}
          description="Checks the credential, logs in and reads the account. A test never places, changes or cancels an order."
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
      ) : (
        <Card title="Test connection">
          <p className={styles.meta}>
            A manual broker has no connection to test. Its holdings come from imported statements.
          </p>
        </Card>
      )}

      <ConfigSaveCard
        title={isNew ? 'Add this broker' : 'Save changes'}
        form={form}
        isNew={isNew}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel={isNew ? 'Add broker in simulation' : 'Save as a new version'}
        onSave={(reason) => {
          save.mutate(
            { isNew, config: draft, reason },
            {
              onSuccess: () => {
                onSaved(draft.brokerId);
              },
            },
          );
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
