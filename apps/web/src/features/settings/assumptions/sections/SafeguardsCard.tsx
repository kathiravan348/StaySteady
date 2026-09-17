import { Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { OperatingPolicyConfigInput } from '../../../../data/schemas';
import type { ConfigDraft } from '../../../../shared/config';
import { CapabilitySwitch, NumberField, SelectField, TextField } from '../../../../shared/config';
import { BASE_CURRENCIES } from '../../../../shared/types/currency';
import styles from '../../Settings.module.scss';

type Safeguards = OperatingPolicyConfigInput['safeguards'];

// Requirements 29 — friction proportional to consequence: a wait between deciding and placing a
// large trade, and a stated reason with every decision.
export function SafeguardsCard({
  form,
}: {
  readonly form: ConfigDraft<OperatingPolicyConfigInput>;
}): ReactElement {
  const { draft, update, error } = form;
  const safeguards = draft.safeguards;
  const set = (path: string, change: (current: Safeguards) => Safeguards): void => {
    update(`safeguards.${path}`, (current) => ({
      ...current,
      safeguards: change(current.safeguards),
    }));
  };

  return (
    <Card title="Decision safeguards">
      <div className={styles.stack}>
        <div className={styles.fieldGrid}>
          <NumberField
            label="Cooling-off period (minutes)"
            step="1"
            value={safeguards.coolingOffMinutes}
            hint="0 turns it off."
            error={error('safeguards.coolingOffMinutes')}
            onChange={(coolingOffMinutes) => {
              set('coolingOffMinutes', (current) => ({ ...current, coolingOffMinutes }));
            }}
          />
          <TextField
            label="Applies to trades above"
            value={safeguards.coolingOffAbove.amount}
            error={error('safeguards.coolingOffAbove.amount')}
            onChange={(amount) => {
              set('coolingOffAbove.amount', (current) => ({
                ...current,
                coolingOffAbove: { ...current.coolingOffAbove, amount },
              }));
            }}
          />
          <SelectField
            label="In"
            value={safeguards.coolingOffAbove.currency}
            options={BASE_CURRENCIES.map((code) => ({ value: code, label: code }))}
            error={error('safeguards.coolingOffAbove.currency')}
            onChange={(currency) => {
              set('coolingOffAbove.currency', (current) => ({
                ...current,
                coolingOffAbove: { ...current.coolingOffAbove, currency },
              }));
            }}
          />
        </div>
        <CapabilitySwitch
          label="Require a stated reason"
          description="Every approval, change and rejection asks why, and the reason is kept in the decision journal."
          isSelected={safeguards.requireStatedReason}
          onChange={(requireStatedReason) => {
            set('requireStatedReason', (current) => ({ ...current, requireStatedReason }));
          }}
        />
      </div>
    </Card>
  );
}
