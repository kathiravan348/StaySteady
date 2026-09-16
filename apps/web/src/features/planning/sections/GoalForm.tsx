import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useGoalAction } from '../../../data/api';
import type { GoalInput } from '../../../data/schemas';
import { BASE_CURRENCIES } from '../../../shared/types/currency';
import styles from '../Planning.module.scss';

const AMOUNT = /^\d+(\.\d{1,2})?$/;

export interface HoldingOption {
  readonly id: string;
  readonly label: string;
}

// Add or edit a goal. The server validates with the same rules; this form checks them first so the
// owner sees what is missing before saving.
export function GoalForm({
  initial,
  holdings,
  onDone,
}: {
  readonly initial: GoalInput | null;
  readonly holdings: readonly HoldingOption[];
  readonly onDone: () => void;
}): ReactElement {
  const action = useGoalAction();
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial?.targetAmount.amount ?? '');
  const [currency, setCurrency] = useState(initial?.targetAmount.currency ?? 'USD');
  const [date, setDate] = useState(initial?.targetDate ?? '');
  const [linked, setLinked] = useState<readonly string[]>(initial?.linkedInstrumentIds ?? []);
  const [contribution, setContribution] = useState(initial?.monthlyContribution.amount ?? '0.00');
  const [expected, setExpected] = useState(String(initial?.expectedReturnPercent ?? 6));

  const today = new Date().toISOString().slice(0, 10);
  const problems = [
    name.trim() === '' ? 'Give the goal a name.' : null,
    !AMOUNT.test(amount) || Number(amount) <= 0
      ? 'Enter a target amount above zero, such as 50000.'
      : null,
    date === '' || date <= today ? 'Choose a target date in the future.' : null,
    linked.length === 0 ? 'Link at least one holding.' : null,
    !AMOUNT.test(contribution) ? 'Enter a monthly contribution, or 0.' : null,
    !Number.isFinite(Number(expected)) || Number(expected) < -20 || Number(expected) > 30
      ? 'Expected return must be from -20% to 30%.'
      : null,
  ].filter((item): item is string => item !== null);

  const submit = (): void => {
    const goal = {
      name: name.trim(),
      targetAmount: { amount, currency },
      targetDate: date,
      linkedInstrumentIds: [...linked],
      monthlyContribution: { amount: contribution, currency },
      expectedReturnPercent: Number(expected),
    };
    action.mutate(
      initial === null
        ? { kind: 'create', goal }
        : { kind: 'update', goal: { ...goal, id: initial.id } },
      { onSuccess: onDone },
    );
  };

  return (
    <Card title={initial === null ? 'New goal' : `Edit ${initial.name}`}>
      <div className={styles.stack}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name</span>
            <input
              className={styles.input}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Target amount</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Currency</span>
            <select
              className={styles.input}
              value={currency}
              onChange={(event) => {
                const next = BASE_CURRENCIES.find((code) => code === event.target.value);
                if (next !== undefined) setCurrency(next);
              }}
            >
              {BASE_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Target date</span>
            <input
              type="date"
              className={styles.input}
              value={date}
              min={today}
              onChange={(event) => {
                setDate(event.target.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Monthly contribution</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={contribution}
              onChange={(event) => {
                setContribution(event.target.value);
              }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Expected yearly return (%)</span>
            <input
              className={styles.input}
              inputMode="decimal"
              value={expected}
              onChange={(event) => {
                setExpected(event.target.value);
              }}
            />
          </label>
        </div>
        <fieldset className={styles.field}>
          <legend className={styles.fieldLabel}>Linked holdings</legend>
          <span className={styles.inline}>
            {holdings.map((holding) => (
              <label key={holding.id} className={styles.note}>
                <input
                  type="checkbox"
                  checked={linked.includes(holding.id)}
                  onChange={(event) => {
                    setLinked(
                      event.target.checked
                        ? [...linked, holding.id]
                        : linked.filter((item) => item !== holding.id),
                    );
                  }}
                />{' '}
                {holding.label}
              </label>
            ))}
          </span>
        </fieldset>
        {problems.length > 0 && (
          <ul className={styles.list} aria-label="What the goal still needs">
            {problems.map((problem) => (
              <li key={problem} className={styles.meta}>
                {problem}
              </li>
            ))}
          </ul>
        )}
        {action.isError && <p className={styles.warning}>{action.error.message}</p>}
        <span className={styles.inline}>
          <Button isDisabled={problems.length > 0} isLoading={action.isPending} onPress={submit}>
            {initial === null ? 'Add goal' : 'Save goal'}
          </Button>
          <Button variant="secondary" onPress={onDone}>
            Cancel
          </Button>
        </span>
      </div>
    </Card>
  );
}
