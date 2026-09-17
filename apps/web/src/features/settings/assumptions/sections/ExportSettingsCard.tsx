import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { OperatingPolicyConfigInput } from '../../../../data/schemas';
import type { ConfigDraft } from '../../../../shared/config';
import {
  CapabilitySwitch,
  CheckboxGroup,
  NumberField,
  SelectField,
} from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { DATASET_OPTIONS, FORMAT_OPTIONS, SCHEDULE_OPTIONS } from '../model/assumptionsDraft';

type Export = OperatingPolicyConfigInput['export'];

// Requirements 34 — complete export in open formats, on demand and on a schedule, readable without
// this software.
export function ExportSettingsCard({
  form,
}: {
  readonly form: ConfigDraft<OperatingPolicyConfigInput>;
}): ReactElement {
  const { draft, update, error } = form;
  const settings = draft.export;
  const set = (path: string, change: (current: Export) => Export): void => {
    update(`export.${path}`, (current) => ({ ...current, export: change(current.export) }));
  };

  return (
    <Card title="Export">
      <div className={styles.stack}>
        <CheckboxGroup
          label="Datasets"
          value={settings.datasets}
          options={DATASET_OPTIONS}
          error={error('export.datasets')}
          onChange={(datasets) => {
            set('datasets', (current) => ({ ...current, datasets }));
          }}
        />
        <CheckboxGroup
          label="Formats"
          value={settings.formats}
          options={FORMAT_OPTIONS}
          error={error('export.formats')}
          onChange={(formats) => {
            set('formats', (current) => ({ ...current, formats }));
          }}
        />
        <div className={styles.fieldGrid}>
          <SelectField
            label="Schedule"
            value={settings.schedule}
            options={SCHEDULE_OPTIONS}
            error={error('export.schedule')}
            onChange={(schedule) => {
              set('schedule', (current) => ({ ...current, schedule }));
            }}
          />
          <NumberField
            label="Keep exports for (years)"
            step="1"
            value={settings.retentionYears}
            hint="Statutory record periods are commonly six to eight years."
            error={error('export.retentionYears')}
            onChange={(retentionYears) => {
              set('retentionYears', (current) => ({ ...current, retentionYears }));
            }}
          />
        </div>
        <CapabilitySwitch
          label="Include field descriptions"
          description="Writes what every column means beside the data, so a future reader does not need this software."
          isSelected={settings.includeFieldDictionary}
          onChange={(includeFieldDictionary) => {
            set('includeFieldDictionary', (current) => ({ ...current, includeFieldDictionary }));
          }}
        />
        <p className={styles.meta}>
          Mock phase: exports are configured here but no file is written.
        </p>
      </div>
    </Card>
  );
}
