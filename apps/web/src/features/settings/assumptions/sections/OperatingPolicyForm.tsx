import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveOperatingPolicy } from '../../../../data/api';
import type { OperatingCostSummaryDto, OperatingPolicyConfigInput } from '../../../../data/schemas';
import { OperatingPolicyConfigSchema } from '../../../../data/schemas';
import { ConfigSaveCard, NumberField, useConfigDraft } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { CostBudgetCard } from './CostBudgetCard';
import { ExportSettingsCard } from './ExportSettingsCard';
import { SafeguardsCard } from './SafeguardsCard';

export interface OperatingPolicyFormProps {
  readonly initial: OperatingPolicyConfigInput;
  readonly costs: OperatingCostSummaryDto;
  readonly onCancel: () => void;
}

// E-09 — cost budget, counterparty threshold, decision safeguards and export settings, saved together
// as one version.
export function OperatingPolicyForm({
  initial,
  costs,
  onCancel,
}: OperatingPolicyFormProps): ReactElement {
  const save = useSaveOperatingPolicy();
  const form = useConfigDraft(initial, OperatingPolicyConfigSchema);
  const { draft, update, error } = form;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>Operating policy</strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      <CostBudgetCard form={form} costs={costs} />

      <Card title="Counterparty concentration">
        <div className={styles.stack}>
          <div className={styles.fieldGrid}>
            <NumberField
              label="Over-weight above (% of portfolio)"
              step="1"
              value={draft.counterpartyMaxSharePercent}
              error={error('counterpartyMaxSharePercent')}
              onChange={(value) => {
                update('counterpartyMaxSharePercent', (current) => ({
                  ...current,
                  counterpartyMaxSharePercent: value,
                }));
              }}
            />
          </div>
          <p className={styles.meta}>
            A broker or custodian holding more than this share of the portfolio is flagged on the
            Risk and Safety panel.
          </p>
        </div>
      </Card>

      <SafeguardsCard form={form} />

      <ExportSettingsCard form={form} />

      <ConfigSaveCard
        title="Save changes"
        form={form}
        isNew={false}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel="Save as a new version"
        onSave={(reason) => {
          save.mutate({ isNew: false, id: draft.id, config: draft, reason });
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
