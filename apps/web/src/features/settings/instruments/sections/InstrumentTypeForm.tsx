import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveInstrumentTypeConfig } from '../../../../data/api';
import type { InstrumentTypeConfigInput } from '../../../../data/schemas';
import { InstrumentTypeConfigSchema } from '../../../../data/schemas';
import {
  CapabilitySwitch,
  CheckboxGroup,
  ConfigSaveCard,
  NumberField,
  TextField,
  useConfigDraft,
} from '../../../../shared/config';
import { instrumentTypeLabel } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import { GRANULARITY_OPTIONS } from '../model/instrumentDraft';

export interface InstrumentTypeFormProps {
  readonly initial: InstrumentTypeConfigInput;
  readonly marketOptions: readonly { value: string; label: string }[];
  readonly onCancel: () => void;
}

type OverrideKey = 'settlementDays' | 'taxThresholdDays';

// UI spec 7.18 — the detail form for one instrument type. Types are a fixed list, so this only edits.
export function InstrumentTypeForm({
  initial,
  marketOptions,
  onCancel,
}: InstrumentTypeFormProps): ReactElement {
  const save = useSaveInstrumentTypeConfig();
  const form = useConfigDraft(initial, InstrumentTypeConfigSchema);
  const { draft, update, error } = form;
  const label = instrumentTypeLabel(draft.type);

  // Settlement and the tax holding period either follow each market or override it for this type.
  const override = (key: OverrideKey, fallback: number, fieldLabel: string): ReactElement => (
    <div className={styles.stack}>
      <label className={styles.checkOption}>
        <input
          type="checkbox"
          checked={draft[key] === null}
          onChange={(event) => {
            update(key, (current) => ({
              ...current,
              [key]: event.target.checked ? null : fallback,
            }));
          }}
        />
        {fieldLabel}: follows each market
      </label>
      {draft[key] !== null && (
        <NumberField
          label={
            key === 'settlementDays' ? 'Settlement (days after trade)' : 'Tax holding period (days)'
          }
          step="1"
          value={draft[key]}
          error={error(key)}
          onChange={(value) => {
            update(key, (current) => ({ ...current, [key]: value }));
          }}
        />
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>{label}</strong>
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      <Card title="Availability">
        <CapabilitySwitch
          label="Enabled"
          description={`Off means ${label} instruments cannot be traded or added anywhere; existing holdings stay visible.`}
          isSelected={draft.enabled}
          onChange={(value) => {
            update('enabled', (current) => ({ ...current, enabled: value }));
          }}
        />
        <CapabilitySwitch
          label="Manual only"
          description="Traded and recorded by hand: no price feed is required and nothing is automated."
          isSelected={draft.manualOnly}
          onChange={(value) => {
            update('manualOnly', (current) => ({
              ...current,
              manualOnly: value,
              automationPermitted: value ? false : current.automationPermitted,
            }));
          }}
        />
        <CapabilitySwitch
          label="Automation permitted"
          description={
            draft.manualOnly
              ? 'A manual-only type is never automated.'
              : 'Strategies may trade this type without asking, where the market and broker also allow it.'
          }
          isSelected={draft.automationPermitted}
          isDisabled={draft.manualOnly}
          onChange={(value) => {
            update('automationPermitted', (current) => ({
              ...current,
              automationPermitted: value,
            }));
          }}
        />
      </Card>

      <Card title="Where and how it trades">
        <div className={styles.stack}>
          <CheckboxGroup
            label="Markets"
            value={draft.markets}
            options={marketOptions}
            error={error('markets')}
            onChange={(markets) => {
              update('markets', (current) => ({ ...current, markets }));
            }}
          />
          <CheckboxGroup
            label="Price granularity"
            value={draft.granularities}
            options={GRANULARITY_OPTIONS}
            error={error('granularities')}
            onChange={(granularities) => {
              update('granularities', (current) => ({ ...current, granularities }));
            }}
          />
          <div className={styles.fieldGrid}>
            <TextField
              label="Minimum quantity"
              value={draft.minimumQuantity}
              error={error('minimumQuantity')}
              onChange={(value) => {
                update('minimumQuantity', (current) => ({ ...current, minimumQuantity: value }));
              }}
            />
            <TextField
              label="Minimum order value"
              hint="In the currency of each trade; 0 means no minimum."
              value={draft.minimumOrderValue}
              error={error('minimumOrderValue')}
              onChange={(value) => {
                update('minimumOrderValue', (current) => ({
                  ...current,
                  minimumOrderValue: value,
                }));
              }}
            />
          </div>
        </div>
      </Card>

      <Card title="Settlement and tax">
        <div className={styles.fieldGrid}>
          {override('settlementDays', 2, 'Settlement')}
          {override('taxThresholdDays', 365, 'Long-term tax holding period')}
        </div>
      </Card>

      <ConfigSaveCard
        title="Save changes"
        form={form}
        isNew={false}
        isSaving={save.isPending}
        saveError={save.isError ? save.error.message : null}
        saveLabel="Save as a new version"
        onSave={(reason) => {
          save.mutate({ isNew: false, id: draft.type, config: draft, reason });
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
