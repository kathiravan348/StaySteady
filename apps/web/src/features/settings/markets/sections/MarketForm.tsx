import { Badge } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveMarketConfig } from '../../../../data/api';
import type { MarketConfigInput } from '../../../../data/schemas';
import { MarketConfigSchema } from '../../../../data/schemas';
import { ConfigSaveCard, SimulationNotice, useConfigDraft } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { MarketCalendarSection, MarketRulesSection } from './MarketCalendarRules';
import { MarketHoursSection, MarketIdentitySection } from './MarketIdentityHours';

export interface MarketFormProps {
  readonly initial: MarketConfigInput;
  readonly isNew: boolean;
  readonly onSaved: (marketId: string) => void;
  readonly onCancel: () => void;
}

// UI spec 7.18 — the detail form for adding or editing. Validation runs on every change with the same
// schema the server uses, and errors appear beside a field once it has been touched.
export function MarketForm({ initial, isNew, onSaved, onCancel }: MarketFormProps): ReactElement {
  const save = useSaveMarketConfig();
  const form = useConfigDraft(initial, MarketConfigSchema);
  const { draft } = form;
  const sectionProps = { draft, isNew, update: form.update, error: form.error };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>
            {isNew ? 'New market' : `${initial.name} (${initial.marketId})`}
          </strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      {isNew && <SimulationNotice subject="market" />}

      <MarketIdentitySection {...sectionProps} />
      <MarketHoursSection {...sectionProps} />
      <MarketCalendarSection {...sectionProps} />
      <MarketRulesSection {...sectionProps} />

      <ConfigSaveCard
        title={isNew ? 'Add this market' : 'Save changes'}
        form={form}
        isNew={isNew}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel={isNew ? 'Add market in simulation' : 'Save as a new version'}
        onSave={(reason) => {
          save.mutate(
            { isNew, config: draft, reason },
            {
              onSuccess: () => {
                onSaved(draft.marketId);
              },
            },
          );
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
