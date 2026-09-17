// Editing the liquidity plan (E-07): reserve, commitments, withdrawal phase and automation ceiling,
// checked with the same schema the server saves with.

import { Button } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useSaveLiquidityPlan } from '../../../data/api';
import type { CommitmentInput, LiquidityPlanInput } from '../../../data/schemas';
import { LiquidityPlanSchema } from '../../../data/schemas';
import styles from '../Planning.module.scss';

export interface LiquidityPlanFormProps {
  readonly initial: LiquidityPlanInput;
  readonly onDone: () => void;
}

function Field({
  label,
  value,
  type = 'text',
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly type?: 'text' | 'number' | 'date';
  readonly onChange: (value: string) => void;
}): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type={type}
        className={styles.input}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}

export function LiquidityPlanForm({ initial, onDone }: LiquidityPlanFormProps): ReactElement {
  const save = useSaveLiquidityPlan();
  const [plan, setPlan] = useState<LiquidityPlanInput>(initial);
  const check = LiquidityPlanSchema.safeParse(plan);
  const problem = check.success ? null : (check.error.issues[0]?.message ?? 'Check the plan');
  const setCommitment = (index: number, change: Partial<CommitmentInput>): void => {
    setPlan((current) => ({
      ...current,
      commitments: current.commitments.map((item, at) =>
        at === index ? { ...item, ...change } : item,
      ),
    }));
  };

  return (
    <div className={styles.stack}>
      <p className={styles.note}>Emergency reserve ({plan.currency})</p>
      <div className={styles.fields}>
        <Field
          label="Monthly expenses"
          value={plan.reserve.monthlyExpenses}
          onChange={(monthlyExpenses) => {
            setPlan((current) => ({
              ...current,
              reserve: { ...current.reserve, monthlyExpenses },
            }));
          }}
        />
        <Field
          label="Target (months)"
          type="number"
          value={String(plan.reserve.targetMonths)}
          onChange={(value) => {
            setPlan((current) => ({
              ...current,
              reserve: { ...current.reserve, targetMonths: Number(value) },
            }));
          }}
        />
        <Field
          label="Held now"
          value={plan.reserve.heldAmount}
          onChange={(heldAmount) => {
            setPlan((current) => ({ ...current, reserve: { ...current.reserve, heldAmount } }));
          }}
        />
        <Field
          label="Kept in"
          value={plan.reserve.heldWhere}
          onChange={(heldWhere) => {
            setPlan((current) => ({ ...current, reserve: { ...current.reserve, heldWhere } }));
          }}
        />
      </div>

      <p className={styles.note}>Known commitments</p>
      {plan.commitments.map((item, index) => (
        <div key={item.id} className={styles.fields}>
          <Field
            label="Commitment"
            value={item.label}
            onChange={(label) => {
              setCommitment(index, { label });
            }}
          />
          <Field
            label="Due"
            type="date"
            value={String(item.dueDate)}
            onChange={(dueDate) => {
              setCommitment(index, { dueDate });
            }}
          />
          <Field
            label="Amount"
            value={item.amount}
            onChange={(amount) => {
              setCommitment(index, { amount });
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              setPlan((current) => ({
                ...current,
                commitments: current.commitments.filter((_, at) => at !== index),
              }));
            }}
          >
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            setPlan((current) => ({
              ...current,
              commitments: [
                ...current.commitments,
                {
                  id: `commit-${String(Date.now())}`,
                  label: '',
                  dueDate: new Date().toISOString().slice(0, 10),
                  amount: '0.00',
                },
              ],
            }));
          }}
        >
          Add a commitment
        </Button>
      </div>

      <p className={styles.note}>Withdrawal phase and automation</p>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Withdrawals started</span>
          <input
            type="checkbox"
            checked={plan.withdrawal.enabled}
            onChange={(event) => {
              const enabled = event.target.checked;
              setPlan((current) => ({
                ...current,
                withdrawal: { ...current.withdrawal, enabled },
              }));
            }}
          />
        </label>
        <Field
          label="Withdrawals start"
          type="date"
          value={plan.withdrawal.startDate === null ? '' : String(plan.withdrawal.startDate)}
          onChange={(value) => {
            setPlan((current) => ({
              ...current,
              withdrawal: { ...current.withdrawal, startDate: value === '' ? null : value },
            }));
          }}
        />
        <Field
          label="Withdraw a year"
          value={plan.withdrawal.annualAmount}
          onChange={(annualAmount) => {
            setPlan((current) => ({
              ...current,
              withdrawal: { ...current.withdrawal, annualAmount },
            }));
          }}
        />
        <Field
          label="Automation ceiling (% of portfolio)"
          type="number"
          value={String(plan.automationCeilingPercent)}
          onChange={(value) => {
            setPlan((current) => ({ ...current, automationCeilingPercent: Number(value) }));
          }}
        />
      </div>

      {problem !== null && <p className={styles.warning}>{problem}</p>}
      {save.isError && <p className={styles.warning}>{save.error.message}</p>}
      <div className={styles.toolbar}>
        <Button variant="secondary" onPress={onDone}>
          Cancel
        </Button>
        <Button
          isDisabled={problem !== null || save.isPending}
          onPress={() => {
            save.mutate(plan, { onSuccess: onDone });
          }}
        >
          Save plan
        </Button>
      </div>
    </div>
  );
}
