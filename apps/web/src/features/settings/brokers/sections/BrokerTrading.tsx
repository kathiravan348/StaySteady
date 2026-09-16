import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import {
  CapabilitySwitch,
  FieldError,
  NumberField,
  SelectField,
  TextField,
} from '../../../../shared/config';
import { formatMoney } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import {
  FEE_MODEL_OPTIONS,
  SAMPLE_TRADE,
  instrumentTypeInSentence,
  sampleFee,
} from '../model/brokerDraft';
import type { BrokerSectionProps } from './BrokerAccount';

type Capability = keyof BrokerSectionProps['draft']['capabilities'];

const CAPABILITIES: readonly { key: Capability; label: string; description: string }[] = [
  {
    key: 'placesOrders',
    label: 'Places orders',
    description:
      'Off means the broker is tracked only: no order is ever sent to it, manual or automated.',
  },
  {
    key: 'streamsPositions',
    label: 'Streams positions',
    description:
      'Positions and balances update from the broker instead of waiting for a statement.',
  },
  {
    key: 'fractionalQuantities',
    label: 'Fractional quantities',
    description: 'Orders may be for part of a share or unit.',
  },
  { key: 'shortSelling', label: 'Short selling', description: 'Orders may sell what is not held.' },
  {
    key: 'paperAccount',
    label: 'Paper account available',
    description:
      'Simulation runs against the broker’s own paper account. Off means the platform simulates fills itself.',
  },
];

const NEEDS_API: readonly Capability[] = ['placesOrders', 'streamsPositions', 'paperAccount'];

export function BrokerCapabilitiesSection({
  draft,
  update,
  error,
}: BrokerSectionProps): ReactElement {
  const isManual = draft.connection === 'manual';
  return (
    <Card title="Capabilities">
      {isManual && (
        <p className={styles.meta}>
          A manual broker has no connection, so it cannot place orders, stream positions or offer a
          paper account.
        </p>
      )}
      {CAPABILITIES.map((item) => (
        <div key={item.key}>
          <CapabilitySwitch
            label={item.label}
            description={item.description}
            isSelected={draft.capabilities[item.key]}
            isDisabled={isManual && NEEDS_API.includes(item.key)}
            onChange={(value) => {
              update(`capabilities.${item.key}`, (current) => {
                const capabilities = { ...current.capabilities, [item.key]: value };
                if (item.key !== 'placesOrders') return { ...current, capabilities };
                // Order types and automation only exist for a broker that places orders.
                return value
                  ? { ...current, capabilities, orderTypes: ['market', 'limit'] }
                  : { ...current, capabilities, orderTypes: [], automationTypes: [] };
              });
            }}
          />
          <FieldError message={error(`capabilities.${item.key}`)} />
        </div>
      ))}
    </Card>
  );
}

export function BrokerFeesSection({ draft, update, error }: BrokerSectionProps): ReactElement {
  const fee = sampleFee(draft);
  const setFees = (path: string, change: Partial<BrokerSectionProps['draft']['fees']>): void => {
    update(path, (current) => ({ ...current, fees: { ...current.fees, ...change } }));
  };
  return (
    <Card
      title="Fees"
      extra={<span className={styles.meta}>Charged in each trade’s currency</span>}
    >
      <div className={styles.stack}>
        <div className={styles.fieldGrid}>
          <SelectField
            label="Commission"
            value={draft.fees.model}
            options={FEE_MODEL_OPTIONS}
            error={error('fees.model')}
            onChange={(model) => {
              setFees('fees.model', { model });
            }}
          />
          {draft.fees.model === 'percentage' && (
            <>
              <NumberField
                label="Rate (bps)"
                value={draft.fees.commissionBps}
                error={error('fees.commissionBps')}
                onChange={(commissionBps) => {
                  setFees('fees.commissionBps', { commissionBps });
                }}
              />
              <TextField
                label="Minimum per order"
                value={draft.fees.minimumPerOrder}
                error={error('fees.minimumPerOrder')}
                onChange={(minimumPerOrder) => {
                  setFees('fees.minimumPerOrder', { minimumPerOrder });
                }}
              />
            </>
          )}
          {draft.fees.model === 'flat' && (
            <TextField
              label="Per order"
              value={draft.fees.flatPerOrder}
              error={error('fees.flatPerOrder')}
              onChange={(flatPerOrder) => {
                setFees('fees.flatPerOrder', { flatPerOrder });
              }}
            />
          )}
        </div>
        {fee !== null && (
          <p className={styles.meta}>
            A {Number(SAMPLE_TRADE).toLocaleString('en-US')} {draft.accountCurrency} trade costs{' '}
            {formatMoney(fee)} in commission.
          </p>
        )}
      </div>
    </Card>
  );
}

export function BrokerAccessSection({
  draft,
  isNew,
  update,
  error,
  automationBlockedMarkets,
}: BrokerSectionProps & { readonly automationBlockedMarkets: readonly string[] }): ReactElement {
  const canAutomate = draft.capabilities.placesOrders;
  return (
    <>
      {draft.connection === 'api' && (
        <Card title="Credential">
          <div className={styles.fieldGrid}>
            <TextField
              label="Credential reference"
              value={draft.credentialRef ?? ''}
              hint="Where the login or API key is kept, such as vault://brokers/name. Never paste the key itself; it is never shown here."
              error={error('credentialRef')}
              onChange={(value) => {
                update('credentialRef', (current) => ({ ...current, credentialRef: value }));
              }}
            />
          </div>
        </Card>
      )}

      <Card title="Automation by instrument type">
        <p className={styles.meta}>
          {canAutomate
            ? 'Automation may trade an instrument type here only when its switch is on. Everything else waits for approval.'
            : 'This broker does not place orders, so nothing can be automated here.'}
        </p>
        {canAutomate && automationBlockedMarkets.length > 0 && (
          <p className={styles.meta}>
            {automationBlockedMarkets.join(', ')}{' '}
            {automationBlockedMarkets.length === 1 ? 'does' : 'do'} not permit automation under
            Countries &amp; markets, so these switches have no effect there.
          </p>
        )}
        {draft.instrumentTypes.map((type) => (
          <CapabilitySwitch
            key={type}
            label={`Automate ${instrumentTypeInSentence(type)}`}
            description={`Strategies may place ${instrumentTypeInSentence(type)} orders at this broker without asking.`}
            isSelected={draft.automationTypes.includes(type)}
            isDisabled={!canAutomate}
            onChange={(value) => {
              update('automationTypes', (current) => ({
                ...current,
                automationTypes: current.instrumentTypes.filter((item) =>
                  item === type ? value : current.automationTypes.includes(item),
                ),
              }));
            }}
          />
        ))}
        <FieldError message={error('automationTypes')} />
      </Card>

      <Card title="Status">
        <CapabilitySwitch
          label="Enabled"
          description="A disabled broker is kept but not reconciled, and no order is sent to it."
          isSelected={draft.enabled}
          onChange={(value) => {
            update('enabled', (current) => ({ ...current, enabled: value }));
          }}
        />
        <CapabilitySwitch
          label="Live"
          description={
            isNew
              ? 'A new broker is saved in simulation first. Switch it to live once its connection test passes.'
              : 'Off means orders for this broker are simulated. In this mock phase nothing reaches a real broker either way.'
          }
          isSelected={draft.mode === 'live'}
          isDisabled={isNew}
          onChange={(value) => {
            update('mode', (current) => ({ ...current, mode: value ? 'live' : 'simulation' }));
          }}
        />
      </Card>
    </>
  );
}
