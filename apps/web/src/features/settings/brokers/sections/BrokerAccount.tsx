import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { BrokerConfigInput } from '../../../../data/schemas';
import { CheckboxGroup, SelectField, TextField } from '../../../../shared/config';
import { SUPPORTED_CURRENCIES } from '../../../../shared/types/currency';
import styles from '../../Settings.module.scss';
import { INSTRUMENT_TYPE_OPTIONS, ORDER_TYPE_OPTIONS, withConnection } from '../model/brokerDraft';

export interface BrokerSectionProps {
  readonly draft: BrokerConfigInput;
  readonly isNew: boolean;
  // Every change names the field it touched, so its error can be shown from then on.
  readonly update: (path: string, change: (draft: BrokerConfigInput) => BrokerConfigInput) => void;
  readonly error: (path: string) => string | undefined;
}

const CONNECTION_OPTIONS = [
  { value: 'api', label: 'API connection' },
  { value: 'manual', label: 'Manual — holdings from imported statements' },
] as const;

export function BrokerAccountSection({
  draft,
  isNew,
  update,
  error,
}: BrokerSectionProps): ReactElement {
  return (
    <Card title="Account">
      <div className={styles.fieldGrid}>
        <TextField
          label="Broker id"
          value={draft.brokerId}
          isDisabled={!isNew}
          hint={
            isNew ? 'brk- then a short lowercase name. It cannot change later.' : 'Cannot change.'
          }
          error={error('brokerId')}
          onChange={(value) => {
            update('brokerId', (current) => ({ ...current, brokerId: value.toLowerCase() }));
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
        <TextField
          label="Country the account is held in"
          value={draft.country}
          error={error('country')}
          onChange={(value) => {
            update('country', (current) => ({ ...current, country: value }));
          }}
        />
        <SelectField
          label="Account currency"
          value={draft.accountCurrency}
          options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
          error={error('accountCurrency')}
          onChange={(value) => {
            update('accountCurrency', (current) => ({ ...current, accountCurrency: value }));
          }}
        />
        <SelectField
          label="Connection"
          value={draft.connection}
          options={CONNECTION_OPTIONS}
          error={error('connection')}
          onChange={(value) => {
            update('connection', (current) => withConnection(current, value));
          }}
        />
      </div>
    </Card>
  );
}

export function BrokerCoverageSection({
  draft,
  update,
  error,
  marketOptions,
}: BrokerSectionProps & {
  readonly marketOptions: readonly { value: string; label: string }[];
}): ReactElement {
  return (
    <Card
      title="What it trades"
      extra={<span className={styles.meta}>Markets, instruments, orders</span>}
    >
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
          label="Instrument types"
          value={draft.instrumentTypes}
          options={INSTRUMENT_TYPE_OPTIONS}
          error={error('instrumentTypes')}
          onChange={(instrumentTypes) => {
            // Automation cannot outlive the instrument type it was allowed for.
            update('instrumentTypes', (current) => ({
              ...current,
              instrumentTypes,
              automationTypes: current.automationTypes.filter((type) =>
                instrumentTypes.includes(type),
              ),
            }));
          }}
        />
        {draft.capabilities.placesOrders ? (
          <CheckboxGroup
            label="Order types"
            value={draft.orderTypes}
            options={ORDER_TYPE_OPTIONS}
            error={error('orderTypes')}
            onChange={(orderTypes) => {
              update('orderTypes', (current) => ({ ...current, orderTypes }));
            }}
          />
        ) : (
          <p className={styles.meta}>
            Order types apply once the broker is allowed to place orders (see Capabilities).
          </p>
        )}
      </div>
    </Card>
  );
}
