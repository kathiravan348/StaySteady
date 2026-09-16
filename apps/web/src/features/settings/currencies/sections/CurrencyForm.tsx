import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSaveCurrencyConfig } from '../../../../data/api';
import type { CurrencyConfigInput } from '../../../../data/schemas';
import { CurrencyConfigSchema } from '../../../../data/schemas';
import {
  CapabilitySwitch,
  ConfigSaveCard,
  NumberField,
  SelectField,
  useConfigDraft,
} from '../../../../shared/config';
import type { CurrencyCode } from '../../../../shared/types/currency';
import styles from '../../Settings.module.scss';
import { SAMPLE_AMOUNT, formatSample, sampleConversionCost } from '../model/currencyDraft';

export interface CurrencyFormProps {
  readonly initial: CurrencyConfigInput;
  readonly baseCurrency: CurrencyCode;
  // Providers that supply FX rates, plus any source the saved version names.
  readonly sourceOptions: readonly { value: string; label: string }[];
  readonly onCancel: () => void;
}

const NONE = 'none';

// UI spec 7.18 — one currency: where its rate comes from and what converting into it costs.
export function CurrencyForm({
  initial,
  baseCurrency,
  sourceOptions,
  onCancel,
}: CurrencyFormProps): ReactElement {
  const save = useSaveCurrencyConfig();
  const form = useConfigDraft(initial, CurrencyConfigSchema);
  const { draft, update, error } = form;
  const isBase = draft.currency === baseCurrency;
  const cost = sampleConversionCost(draft.conversionCostBps, baseCurrency);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>{draft.currency}</strong>
          {isBase && <Badge variant="info">Base currency</Badge>}
          {form.isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      <Card title="Availability">
        <CapabilitySwitch
          label="Enabled"
          description={
            isBase
              ? 'The base currency cannot be disabled. Choose another base currency first.'
              : 'Off means nothing new can be priced, bought or reported in this currency.'
          }
          isSelected={draft.enabled}
          isDisabled={isBase && draft.enabled}
          onChange={(value) => {
            update('enabled', (current) => ({ ...current, enabled: value }));
          }}
        />
      </Card>

      <Card title="Exchange rate source">
        <div className={styles.stack}>
          {isBase && (
            <p className={styles.meta}>
              Other currencies are converted into this one, so its own rate is always 1. The source
              below is used if the base currency changes.
            </p>
          )}
          <div className={styles.fieldGrid}>
            <SelectField
              label="Rate source"
              value={draft.rateSourceId}
              options={sourceOptions}
              error={error('rateSourceId')}
              onChange={(rateSourceId) => {
                update('rateSourceId', (current) => ({ ...current, rateSourceId }));
              }}
            />
            <SelectField
              label="Fallback source"
              value={draft.fallbackSourceId ?? NONE}
              options={[{ value: NONE, label: 'None — rates go stale' }, ...sourceOptions]}
              error={error('fallbackSourceId')}
              onChange={(value) => {
                update('fallbackSourceId', (current) => ({
                  ...current,
                  fallbackSourceId: value === NONE ? null : value,
                }));
              }}
            />
            <NumberField
              label="Rate goes stale after (minutes)"
              step="1"
              value={draft.maxRateAgeMinutes}
              hint="Conversions using an older rate are flagged as stale."
              error={error('maxRateAgeMinutes')}
              onChange={(value) => {
                update('maxRateAgeMinutes', (current) => ({
                  ...current,
                  maxRateAgeMinutes: value,
                }));
              }}
            />
          </div>
        </div>
      </Card>

      <Card title="Conversion cost">
        <div className={styles.stack}>
          <div className={styles.fieldGrid}>
            <NumberField
              label="Cost to convert into it (bps)"
              value={draft.conversionCostBps}
              hint="Spread and fee together, assumed by backtests, trade previews and cost reports."
              error={error('conversionCostBps')}
              onChange={(value) => {
                update('conversionCostBps', (current) => ({
                  ...current,
                  conversionCostBps: value,
                }));
              }}
            />
          </div>
          {!isBase && (
            <p className={styles.meta}>
              Converting {SAMPLE_AMOUNT.toLocaleString('en-US')} {baseCurrency} into{' '}
              {draft.currency} is assumed to cost {formatSample(cost)}.
            </p>
          )}
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
          save.mutate({ isNew: false, id: draft.currency, config: draft, reason });
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
