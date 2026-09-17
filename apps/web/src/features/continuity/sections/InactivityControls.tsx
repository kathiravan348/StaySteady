import { Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { InactivitySettingDto } from '../../../data/schemas/continuity';
import { UpdateInactivityRequestSchema } from '../../../data/schemas/continuity';
import { useUpdateInactivity } from '../../../data/api';
import styles from '../Continuity.module.scss';

export function InactivityControls({
  inactivity,
}: {
  readonly inactivity: InactivitySettingDto;
}): ReactElement {
  const updateInactivity = useUpdateInactivity();
  const [thresholdDays, setThresholdDays] = useState(String(inactivity.thresholdDays));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const num = parseInt(thresholdDays, 10);
  const parsed = UpdateInactivityRequestSchema.safeParse({ thresholdDays: num });

  return (
    <Card title="Inactivity Threshold Configuration" isCollapsible defaultExpanded>
      <div className={styles.stack}>
        <p className={styles.note}>
          To protect capital if the system is left unattended due to unforeseen absence or
          incapacity, all automated order submission and strategy signals will automatically pause
          once no activity is detected for the threshold duration. Working stop-loss orders remain
          in broker custody.
        </p>

        <form
          className={styles.actionRow}
          onSubmit={(e) => {
            e.preventDefault();
            if (!parsed.success) return;
            updateInactivity.mutate(parsed.data, {
              onSuccess: () => {
                setSavedSuccess(true);
                setTimeout(() => {
                  setSavedSuccess(false);
                }, 3000);
              },
            });
          }}
        >
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Inactivity threshold (days)</span>
            <input
              type="number"
              className={styles.input}
              min={7}
              max={180}
              value={thresholdDays}
              onChange={(e) => {
                setThresholdDays(e.target.value);
                setSavedSuccess(false);
              }}
            />
          </label>

          <Button
            type="submit"
            variant="secondary"
            isDisabled={updateInactivity.isPending || !parsed.success}
          >
            {updateInactivity.isPending ? 'Saving...' : 'Update threshold'}
          </Button>

          {savedSuccess && <span className={styles.meta}>✓ Threshold updated</span>}
        </form>

        {!parsed.success && <p className={styles.error}>{parsed.error.issues[0]?.message}</p>}

        <p className={styles.meta}>
          Escalating warning alerts are dispatched via configured notification channels at{' '}
          {inactivity.escalatingAlertDays.join(' days, ')} days prior to the automation pause.
        </p>
      </div>
    </Card>
  );
}
