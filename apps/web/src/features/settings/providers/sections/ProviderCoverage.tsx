import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ProviderConfigInput } from '../../../../data/schemas';
import { CheckboxGroup, NumberField, TextField } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { DATA_KIND_OPTIONS, GRANULARITY_OPTIONS } from '../model/providerDraft';

export interface ProviderSectionProps {
  readonly draft: ProviderConfigInput;
  readonly isNew: boolean;
  // Every change names the field it touched, so its error can be shown from then on.
  readonly update: (
    path: string,
    change: (draft: ProviderConfigInput) => ProviderConfigInput,
  ) => void;
  readonly error: (path: string) => string | undefined;
}

export function ProviderIdentitySection({
  draft,
  isNew,
  update,
  error,
}: ProviderSectionProps): ReactElement {
  return (
    <Card title="Identity">
      <div className={styles.fieldGrid}>
        <TextField
          label="Provider id"
          value={draft.providerId}
          isDisabled={!isNew}
          hint={
            isNew ? 'prov- then a short lowercase name. It cannot change later.' : 'Cannot change.'
          }
          error={error('providerId')}
          onChange={(value) => {
            update('providerId', (current) => ({ ...current, providerId: value.toLowerCase() }));
          }}
        />
        <TextField
          label="Name"
          value={draft.name}
          error={error('name')}
          onChange={(value) => {
            update('name', (current) => ({ ...current, name: value }));
          }}
        />
      </div>
    </Card>
  );
}

export function ProviderCoverageSection({
  draft,
  update,
  error,
  marketOptions,
}: ProviderSectionProps & {
  readonly marketOptions: readonly { value: string; label: string }[];
}): ReactElement {
  return (
    <Card title="Coverage" extra={<span className={styles.meta}>What this provider supplies</span>}>
      <div className={styles.stack}>
        <CheckboxGroup
          label="Markets"
          value={draft.coverage.markets}
          options={marketOptions}
          error={error('coverage.markets')}
          onChange={(markets) => {
            update('coverage.markets', (current) => ({
              ...current,
              coverage: { ...current.coverage, markets },
            }));
          }}
        />
        <CheckboxGroup
          label="Data"
          value={draft.coverage.dataKinds}
          options={DATA_KIND_OPTIONS}
          error={error('coverage.dataKinds')}
          onChange={(dataKinds) => {
            update('coverage.dataKinds', (current) => ({
              ...current,
              coverage: { ...current.coverage, dataKinds },
            }));
          }}
        />
        <CheckboxGroup
          label="Granularity (prices, intraday bars and FX rates)"
          value={draft.granularities}
          options={GRANULARITY_OPTIONS}
          error={error('granularities')}
          onChange={(granularities) => {
            update('granularities', (current) => ({ ...current, granularities }));
          }}
        />
        <div className={styles.fieldGrid}>
          <NumberField
            label="History depth (years)"
            value={draft.historyDepthYears}
            hint="How far back the provider's data goes. Backtests cannot start earlier."
            error={error('historyDepthYears')}
            onChange={(value) => {
              update('historyDepthYears', (current) => ({ ...current, historyDepthYears: value }));
            }}
          />
        </div>
      </div>
    </Card>
  );
}
