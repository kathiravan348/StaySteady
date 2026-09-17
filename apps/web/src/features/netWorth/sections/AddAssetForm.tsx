import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useAddManualAsset } from '../../../data/api';
import type { ManualAssetFieldsInput, ReportCurrencyDto } from '../../../data/schemas';
import { CurrencyCodeSchema, ManualAssetFieldsSchema } from '../../../data/schemas';
import {
  DateField,
  NumberField,
  SelectField,
  TextField,
  useConfigDraft,
} from '../../../shared/config';
import styles from '../NetWorth.module.scss';
import {
  ASSET_CLASS_OPTIONS,
  CATEGORY_OPTIONS,
  LIQUIDITY_OPTIONS,
  METHOD_OPTIONS,
} from '../model/netWorthLabels';

const CURRENCY_OPTIONS = CurrencyCodeSchema.options.map((value) => ({ value, label: value }));

// Adds a record to the register. Maturity, purchase cost, vesting and a secured loan are kept on the
// seeded records; this form covers what every record needs.
export function AddAssetForm({
  initial,
  currency,
  onDone,
}: {
  readonly initial: ManualAssetFieldsInput;
  readonly currency: ReportCurrencyDto;
  readonly onDone: () => void;
}): ReactElement {
  const add = useAddManualAsset(currency);
  const form = useConfigDraft(initial, ManualAssetFieldsSchema);
  const { draft, update, error } = form;
  const set = <K extends keyof ManualAssetFieldsInput>(
    key: K,
    value: ManualAssetFieldsInput[K],
  ): void => {
    update(key, (current) => ({ ...current, [key]: value }));
  };

  return (
    <Card title="Add an asset or liability">
      <form
        className={styles.stack}
        onSubmit={(event) => {
          event.preventDefault();
          // Marks every field as submitted so its error shows; there is no change reason here.
          form.attemptSave();
          if (form.errorCount > 0) return;
          add.mutate(draft, { onSuccess: onDone });
        }}
      >
        <div className={styles.fieldGrid}>
          <SelectField
            label="Type"
            value={draft.category}
            options={CATEGORY_OPTIONS}
            error={error('category')}
            onChange={(value) => {
              set('category', value);
            }}
          />
          <TextField
            label="Name"
            value={draft.name}
            error={error('name')}
            onChange={(value) => {
              set('name', value);
            }}
          />
          <TextField
            label="Held at"
            value={draft.institution}
            error={error('institution')}
            onChange={(value) => {
              set('institution', value);
            }}
          />
          <SelectField
            label="Currency"
            value={draft.currency}
            options={CURRENCY_OPTIONS}
            error={error('currency')}
            onChange={(value) => {
              set('currency', value);
            }}
          />
          <TextField
            label={draft.category === 'liability' ? 'Amount owed' : 'Value'}
            value={draft.value}
            error={error('value')}
            onChange={(value) => {
              set('value', value);
            }}
          />
          <DateField
            label="Valued on"
            value={draft.valuedOn}
            error={error('valuedOn')}
            onChange={(value) => {
              set('valuedOn', value);
            }}
          />
          <SelectField
            label="Valuation"
            value={draft.method}
            options={METHOD_OPTIONS}
            error={error('method')}
            onChange={(value) => {
              update('method', (current) => ({
                ...current,
                method: value,
                annualRatePercent: value === 'formula' ? (current.annualRatePercent ?? 0) : null,
              }));
            }}
          />
          {draft.method === 'formula' && (
            <NumberField
              label="Yearly rate (%)"
              value={draft.annualRatePercent ?? Number.NaN}
              error={error('annualRatePercent')}
              onChange={(value) => {
                set('annualRatePercent', value);
              }}
            />
          )}
          <SelectField
            label="Liquidity"
            value={draft.liquidity}
            options={LIQUIDITY_OPTIONS}
            error={error('liquidity')}
            onChange={(value) => {
              set('liquidity', value);
            }}
          />
          <SelectField
            label="Asset class"
            value={draft.assetClass}
            options={ASSET_CLASS_OPTIONS}
            error={error('assetClass')}
            onChange={(value) => {
              set('assetClass', value);
            }}
          />
          <TextField
            label="Issuer (optional)"
            hint="Used for concentration, such as a bank or government."
            value={draft.issuer ?? ''}
            error={error('issuer')}
            onChange={(value) => {
              set('issuer', value.trim() === '' ? null : value);
            }}
          />
          <NumberField
            label="Due for an update after (days)"
            step="1"
            value={draft.staleAfterDays}
            error={error('staleAfterDays')}
            onChange={(value) => {
              set('staleAfterDays', value);
            }}
          />
          <label className={styles.checkOption}>
            <input
              type="checkbox"
              checked={draft.verified}
              onChange={(event) => {
                set('verified', event.target.checked);
              }}
            />
            Checked against a statement or valuer
          </label>
        </div>
        <span className={styles.inline}>
          <Button type="submit" isDisabled={add.isPending}>
            {add.isPending ? 'Adding…' : 'Add to the register'}
          </Button>
          <Button variant="secondary" onPress={onDone}>
            Cancel
          </Button>
          {form.submitted && form.errorCount > 0 && (
            <span className={styles.warning}>Fix the fields marked above.</span>
          )}
          {add.isError && <span className={styles.warning}>{add.error.message}</span>}
        </span>
      </form>
    </Card>
  );
}
