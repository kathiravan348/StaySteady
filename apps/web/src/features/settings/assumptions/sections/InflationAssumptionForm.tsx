import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveInflationAssumption } from '../../../../data/api';
import type { InflationAssumptionConfigInput, InflationYearDto } from '../../../../data/schemas';
import { InflationAssumptionConfigSchema } from '../../../../data/schemas';
import {
  CapabilitySwitch,
  ConfigSaveCard,
  NumberField,
  useConfigDraft,
} from '../../../../shared/config';
import { formatPercentage } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import { COUNTRY_LABEL } from '../model/assumptionsDraft';

export interface InflationAssumptionFormProps {
  readonly initial: InflationAssumptionConfigInput;
  // Recorded yearly figures for this country, oldest first; empty when none were returned.
  readonly recorded: readonly InflationYearDto[];
  readonly onCancel: () => void;
}

const SHOWN_YEARS = 5;

// Requirements 30 — a configurable inflation assumption per country, beside the recorded figures.
export function InflationAssumptionForm({
  initial,
  recorded,
  onCancel,
}: InflationAssumptionFormProps): ReactElement {
  const save = useSaveInflationAssumption();
  const form = useConfigDraft(initial, InflationAssumptionConfigSchema);
  const { draft, update, error } = form;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>{COUNTRY_LABEL[draft.country]}</strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      <Card title="Assumption">
        <div className={styles.stack}>
          <div className={styles.fieldGrid}>
            <NumberField
              label="Assumed inflation (% a year)"
              step="0.1"
              value={draft.assumedAnnualPercent}
              hint="Used for projections and goal progress in today's money."
              error={error('assumedAnnualPercent')}
              onChange={(value) => {
                update('assumedAnnualPercent', (current) => ({
                  ...current,
                  assumedAnnualPercent: value,
                }));
              }}
            />
            <NumberField
              label="Review every (days)"
              step="1"
              value={draft.reviewEveryDays}
              error={error('reviewEveryDays')}
              onChange={(value) => {
                update('reviewEveryDays', (current) => ({ ...current, reviewEveryDays: value }));
              }}
            />
          </div>
          <CapabilitySwitch
            label="Use recorded inflation for past periods"
            description="Off applies the assumption to past periods too, so real returns can be compared on one rate."
            isSelected={draft.useRecordedHistory}
            onChange={(value) => {
              update('useRecordedHistory', (current) => ({
                ...current,
                useRecordedHistory: value,
              }));
            }}
          />
        </div>
      </Card>

      <Card title="Recorded inflation">
        {recorded.length === 0 ? (
          <p className={styles.meta}>No recorded figures for this country.</p>
        ) : (
          <ul className={styles.rowList} aria-label={`Recorded inflation, ${draft.country}`}>
            {recorded.slice(-SHOWN_YEARS).map((year) => (
              <li key={year.year} className={styles.row}>
                <span className={styles.note}>{year.year}</span>
                <span className={styles.note}>
                  {formatPercentage(year.ratePercent, { decimals: 1, signed: false })}
                </span>
                {year.isEstimate && <Badge variant="neutral">Estimate, year in progress</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfigSaveCard
        title="Save changes"
        form={form}
        isNew={false}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel="Save as a new version"
        onSave={(reason) => {
          save.mutate({ isNew: false, id: draft.country, config: draft, reason });
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
