import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ProviderConfigInput } from '../../../../data/schemas';
import { SUPPORTED_CURRENCIES } from '../../../../shared/types/currency';
import { CapabilitySwitch, NumberField, SelectField, TextField } from '../../../../shared/config';
import { formatMoney } from '../../../../shared/format';
import styles from '../../Settings.module.scss';
import { dataKindLabel, failoverChains, fullUseCost } from '../model/providerDraft';
import type { ProviderSectionProps } from './ProviderCoverage';

export function ProviderLimitsSection({
  draft,
  update,
  error,
}: ProviderSectionProps): ReactElement {
  const fullUse = fullUseCost(draft);
  return (
    <Card title="Rate limits and cost">
      <div className={styles.stack}>
        <div className={styles.fieldGrid}>
          <NumberField
            label="Requests per minute"
            step="1"
            value={draft.rateLimits.requestsPerMinute}
            error={error('rateLimits.requestsPerMinute')}
            onChange={(value) => {
              update('rateLimits.requestsPerMinute', (current) => ({
                ...current,
                rateLimits: { ...current.rateLimits, requestsPerMinute: value },
              }));
            }}
          />
          <NumberField
            label="Requests per month"
            step="1"
            value={draft.rateLimits.requestsPerMonth}
            error={error('rateLimits.requestsPerMonth')}
            onChange={(value) => {
              update('rateLimits.requestsPerMonth', (current) => ({
                ...current,
                rateLimits: { ...current.rateLimits, requestsPerMonth: value },
              }));
            }}
          />
          <SelectField
            label="Billing currency"
            value={draft.cost.currency}
            options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
            error={error('cost.currency')}
            onChange={(value) => {
              update('cost.currency', (current) => ({
                ...current,
                cost: { ...current.cost, currency: value },
              }));
            }}
          />
          <TextField
            label={`Monthly budget (${draft.cost.currency})`}
            value={draft.cost.monthlyBudget}
            error={error('cost.monthlyBudget')}
            onChange={(value) => {
              update('cost.monthlyBudget', (current) => ({
                ...current,
                cost: { ...current.cost, monthlyBudget: value },
              }));
            }}
          />
          <TextField
            label={`Cost per 1,000 requests (${draft.cost.currency})`}
            value={draft.cost.perThousandRequests}
            error={error('cost.perThousandRequests')}
            onChange={(value) => {
              update('cost.perThousandRequests', (current) => ({
                ...current,
                cost: { ...current.cost, perThousandRequests: value },
              }));
            }}
          />
        </div>
        {fullUse !== null && (
          <p className={fullUse.overBudget ? styles.warning : styles.meta}>
            Using the whole monthly limit would cost {formatMoney(fullUse.cost)}
            {fullUse.overBudget
              ? `, more than the ${formatMoney(fullUse.budget)} budget. System Health warns at 80% of the budget.`
              : `, within the ${formatMoney(fullUse.budget)} budget.`}
          </p>
        )}
      </div>
    </Card>
  );
}

export function ProviderPrioritySection({
  draft,
  update,
  error,
  saved,
}: ProviderSectionProps & { readonly saved: readonly ProviderConfigInput[] }): ReactElement {
  const chains = failoverChains(draft, saved);
  return (
    <Card title="Priority order" extra={<span className={styles.meta}>1 is asked first</span>}>
      <div className={styles.stack}>
        <div className={styles.fieldGrid}>
          <NumberField
            label="Priority"
            step="1"
            value={draft.priority}
            hint="A provider is only asked when every provider with a lower number has failed."
            error={error('priority')}
            onChange={(value) => {
              update('priority', (current) => ({ ...current, priority: value }));
            }}
          />
        </div>
        {draft.mode === 'simulation' && chains.length > 0 && (
          <p className={styles.meta}>
            In simulation this provider is not asked for data. The order shows where it would sit
            once live.
          </p>
        )}
        {chains.length === 0 ? (
          <p className={styles.meta}>
            Choose the data this provider supplies to see its failover order.
          </p>
        ) : (
          <ul className={styles.rowList} aria-label="Failover order">
            {chains.map((chain) => (
              <li key={chain.kind} className={styles.stack}>
                <span className={styles.sectionTitle}>{dataKindLabel(chain.kind)}</span>
                <ol className={styles.rowList}>
                  {chain.steps.map((step) => (
                    <li key={step.providerId} className={step.isThis ? styles.note : styles.meta}>
                      {step.priority}. {step.name}
                      {step.isThis ? ' (this provider)' : ''} —{' '}
                      {step.markets.join(', ') || 'no markets'}
                    </li>
                  ))}
                </ol>
                {chain.tiedWith.length > 0 && (
                  <span className={styles.warning}>
                    Shares priority {draft.priority} with {chain.tiedWith.join(', ')}, so which is
                    asked first is undefined. Give one a different number.
                  </span>
                )}
                {chain.withoutFallback.length > 0 && (
                  <span className={styles.meta}>
                    No other live provider covers {chain.withoutFallback.join(', ')}; if this one
                    fails, that data stops.
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function ProviderAccessSection({
  draft,
  update,
  error,
}: ProviderSectionProps): ReactElement {
  return (
    <Card title="Credential and monitoring">
      <div className={styles.stack}>
        <CapabilitySwitch
          label="Needs a credential"
          description="Off for providers that publish their data openly, such as reference FX rates."
          isSelected={draft.requiresCredential}
          onChange={(value) => {
            update('credentialRef', (current) => ({
              ...current,
              requiresCredential: value,
              credentialRef: value ? (current.credentialRef ?? 'vault://providers/') : null,
            }));
          }}
        />
        {draft.requiresCredential && (
          <div className={styles.fieldGrid}>
            <TextField
              label="Credential reference"
              value={draft.credentialRef ?? ''}
              hint="Where the key is kept, such as vault://providers/name. Never paste the key itself; it is never shown here."
              error={error('credentialRef')}
              onChange={(value) => {
                update('credentialRef', (current) => ({ ...current, credentialRef: value }));
              }}
            />
          </div>
        )}
        <div className={styles.fieldGrid}>
          <NumberField
            label="Health check every (seconds)"
            step="1"
            value={draft.healthCheck.intervalSeconds}
            error={error('healthCheck.intervalSeconds')}
            onChange={(value) => {
              update('healthCheck.intervalSeconds', (current) => ({
                ...current,
                healthCheck: { ...current.healthCheck, intervalSeconds: value },
              }));
            }}
          />
          <NumberField
            label="Health check timeout (ms)"
            step="1"
            value={draft.healthCheck.timeoutMs}
            error={error('healthCheck.timeoutMs')}
            onChange={(value) => {
              update('healthCheck.timeoutMs', (current) => ({
                ...current,
                healthCheck: { ...current.healthCheck, timeoutMs: value },
              }));
            }}
          />
          <NumberField
            label="Data counts as late after (seconds)"
            step="1"
            value={draft.freshnessSeconds}
            hint="System Health marks this provider stale beyond this age."
            error={error('freshnessSeconds')}
            onChange={(value) => {
              update('freshnessSeconds', (current) => ({ ...current, freshnessSeconds: value }));
            }}
          />
        </div>
      </div>
    </Card>
  );
}

export function ProviderCapabilitiesSection({
  draft,
  isNew,
  update,
}: ProviderSectionProps): ReactElement {
  return (
    <Card title="Capabilities">
      <CapabilitySwitch
        label="Enabled"
        description="A disabled provider is kept but never asked for data, and drops out of every failover order."
        isSelected={draft.enabled}
        onChange={(value) => {
          update('enabled', (current) => ({ ...current, enabled: value }));
        }}
      />
      <CapabilitySwitch
        label="Live"
        description={
          isNew
            ? 'A new provider is saved in simulation first. Switch it to live once its connection test passes.'
            : 'Off means its data is collected for comparison only; screens and strategies do not use it.'
        }
        isSelected={draft.mode === 'live'}
        isDisabled={isNew}
        onChange={(value) => {
          update('mode', (current) => ({ ...current, mode: value ? 'live' : 'simulation' }));
        }}
      />
    </Card>
  );
}
