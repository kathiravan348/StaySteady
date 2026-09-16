import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useRevertBaseCurrency, useSaveBaseCurrency } from '../../../../data/api';
import type { BaseCurrencyEntryDto, CurrencyConfigEntryDto } from '../../../../data/schemas';
import { BaseCurrencyConfigSchema } from '../../../../data/schemas';
import {
  ConfigSaveCard,
  SelectField,
  VersionHistory,
  useConfigDraft,
} from '../../../../shared/config';
import { BASE_CURRENCIES } from '../../../../shared/types/currency';
import styles from '../../Settings.module.scss';
import { describeBaseCurrency } from '../model/currencyDraft';

interface BaseCurrencyFormProps {
  readonly entry: BaseCurrencyEntryDto;
  readonly currencies: readonly CurrencyConfigEntryDto[];
  readonly onCancel: () => void;
}

function BaseCurrencyForm({ entry, currencies, onCancel }: BaseCurrencyFormProps): ReactElement {
  const save = useSaveBaseCurrency();
  const form = useConfigDraft({ currency: entry.config.currency }, BaseCurrencyConfigSchema);
  const enabled = (code: string): boolean =>
    currencies.some((item) => item.config.currency === code && item.config.enabled);

  return (
    <>
      <Card title="Base currency">
        <div className={styles.stack}>
          <div className={styles.fieldGrid}>
            <SelectField
              label="Report totals in"
              value={form.draft.currency}
              options={BASE_CURRENCIES.map((code) => ({
                value: code,
                label: enabled(code) ? code : `${code} (disabled)`,
              }))}
              error={form.error('currency')}
              onChange={(currency) => {
                form.update('currency', () => ({ currency }));
              }}
            />
          </div>
          <p className={styles.meta}>
            Portfolio totals, reports and limits are expressed in the base currency. The currency
            switch in the top bar only changes what is displayed for the session.
          </p>
          {!enabled(form.draft.currency) && (
            <p className={styles.warning}>
              {form.draft.currency} is disabled below; enable it before making it the base currency.
            </p>
          )}
        </div>
      </Card>
      {form.isDirty && (
        <ConfigSaveCard
          title="Change the base currency"
          form={form}
          isNew={false}
          isSaving={save.isPending}
          saveError={save.isError ? save.error.message : null}
          saveLabel="Save as a new version"
          onSave={(reason) => {
            save.mutate({ config: form.draft, reason });
          }}
          onCancel={onCancel}
        />
      )}
    </>
  );
}

export function BaseCurrencySection({
  entry,
  currencies,
  resets,
  onReset,
}: {
  readonly entry: BaseCurrencyEntryDto;
  readonly currencies: readonly CurrencyConfigEntryDto[];
  readonly resets: number;
  readonly onReset: () => void;
}): ReactElement {
  const revert = useRevertBaseCurrency();
  return (
    <div className={styles.page}>
      <BaseCurrencyForm
        key={`${String(entry.versions[0]?.version ?? 0)}-${String(resets)}`}
        entry={entry}
        currencies={currencies}
        onCancel={onReset}
      />
      <VersionHistory
        versions={entry.versions.map((version) => ({
          version: version.version,
          savedAt: version.savedAt,
          reason: version.reason,
          description: describeBaseCurrency(version.snapshot),
        }))}
        isBusy={revert.isPending}
        error={revert.isError ? revert.error.message : null}
        onRevert={(version, reason) => {
          revert.mutate({ version, reason });
        }}
      />
    </div>
  );
}
