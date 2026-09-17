// Nominees and drill schedule (S-36; requirements 28; owner question 17): a primary and a backup
// view-only nominee, and an access drill every 6 to 12 months.

import { Button } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useUpdateAccessPlan } from '../../../data/api';
import type { EmergencyAccessPlaybookDto } from '../../../data/schemas/continuity';
import { UpdateAccessPlanRequestSchema } from '../../../data/schemas/continuity';
import styles from '../Continuity.module.scss';

const INTERVALS = [
  { days: 180, label: 'Every 6 months' },
  { days: 270, label: 'Every 9 months' },
  { days: 365, label: 'Every 12 months' },
];

export function AccessPlanForm({
  playbook,
}: {
  readonly playbook: EmergencyAccessPlaybookDto;
}): ReactElement {
  const save = useUpdateAccessPlan();
  const [isOpen, setOpen] = useState(false);
  const [primary, setPrimary] = useState(playbook.nominatedPerson);
  const [backup, setBackup] = useState(playbook.backupNominee ?? '');
  const [interval, setInterval] = useState(playbook.testIntervalDays);
  const parsed = UpdateAccessPlanRequestSchema.safeParse({
    nominatedPerson: primary,
    backupNominee: backup,
    testIntervalDays: interval,
  });
  const problem = !parsed.success
    ? (parsed.error.issues[0]?.message ?? 'Check the plan')
    : parsed.data.backupNominee === parsed.data.nominatedPerson
      ? 'The backup nominee must be a different person'
      : null;

  if (!isOpen) {
    return (
      <div className={styles.actionRow}>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            setOpen(true);
          }}
        >
          Change nominees or drill schedule
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.item}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Primary nominee</span>
        <input
          className={styles.input}
          value={primary}
          onChange={(event) => {
            setPrimary(event.target.value);
          }}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Backup nominee</span>
        <input
          className={styles.input}
          value={backup}
          onChange={(event) => {
            setBackup(event.target.value);
          }}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Access drill</span>
        <select
          className={styles.input}
          value={String(interval)}
          onChange={(event) => {
            setInterval(Number(event.target.value));
          }}
        >
          {INTERVALS.map((option) => (
            <option key={option.days} value={String(option.days)}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {problem !== null && <p className={styles.meta}>{problem}</p>}
      {save.isError && <p className={styles.meta}>{save.error.message}</p>}
      <div className={styles.actionRow}>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            setOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          isDisabled={problem !== null || save.isPending || !parsed.success}
          onPress={() => {
            if (!parsed.success) return;
            save.mutate(parsed.data, {
              onSuccess: () => {
                setOpen(false);
              },
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
