import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { TaxRuleSetConfigInput } from '../../../../data/schemas';
import type { ConfigDraft } from '../../../../shared/config';
import { CapabilitySwitch, SelectField, TextField } from '../../../../shared/config';
import { BASE_CURRENCIES } from '../../../../shared/types/currency';
import styles from '../../Settings.module.scss';

type Foreign = TaxRuleSetConfigInput['foreignAssets'];

// Requirements 26 — cross-border obligations where foreign assets are held.
export function ForeignAssetsCard({
  form,
}: {
  readonly form: ConfigDraft<TaxRuleSetConfigInput>;
}): ReactElement {
  const { draft, update, error } = form;
  const foreign = draft.foreignAssets;
  const cap = foreign.remittanceCapPerYear;
  const set = (path: string, change: (current: Foreign) => Foreign): void => {
    update(`foreignAssets.${path}`, (current) => ({
      ...current,
      foreignAssets: change(current.foreignAssets),
    }));
  };

  return (
    <Card title="Foreign assets">
      <div className={styles.stack}>
        <CapabilitySwitch
          label="Annual foreign asset disclosure"
          description="Foreign holdings must be listed in the yearly return, with values for the period."
          isSelected={foreign.annualDisclosureRequired}
          onChange={(annualDisclosureRequired) => {
            set('annualDisclosureRequired', (current) => ({
              ...current,
              annualDisclosureRequired,
            }));
          }}
        />
        <CapabilitySwitch
          label="Foreign tax credit claimable"
          description="Tax already paid abroad can be credited, with evidence of the payment."
          isSelected={foreign.foreignTaxCreditClaimable}
          onChange={(foreignTaxCreditClaimable) => {
            set('foreignTaxCreditClaimable', (current) => ({
              ...current,
              foreignTaxCreditClaimable,
            }));
          }}
        />
        <CapabilitySwitch
          label="Yearly cap on money sent abroad"
          description="A warning is raised before a remittance would pass the cap."
          isSelected={cap !== null}
          onChange={(isSelected) => {
            set('remittanceCapPerYear', (current) => ({
              ...current,
              remittanceCapPerYear: isSelected ? { currency: 'USD', amount: '250000.00' } : null,
            }));
          }}
        />
        {cap !== null && (
          <div className={styles.fieldGrid}>
            <TextField
              label="Cap per tax year"
              value={cap.amount}
              error={error('foreignAssets.remittanceCapPerYear.amount')}
              onChange={(amount) => {
                set('remittanceCapPerYear.amount', (current) => ({
                  ...current,
                  remittanceCapPerYear: { currency: cap.currency, amount },
                }));
              }}
            />
            <SelectField
              label="In"
              value={cap.currency}
              options={BASE_CURRENCIES.map((code) => ({ value: code, label: code }))}
              error={undefined}
              onChange={(currency) => {
                set('remittanceCapPerYear.currency', (current) => ({
                  ...current,
                  remittanceCapPerYear: { amount: cap.amount, currency },
                }));
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
