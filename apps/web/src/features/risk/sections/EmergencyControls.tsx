import { Badge, Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useEmergencyAction, useOrderHistory } from '../../../data/api';
import type { EmergencyActionDto } from '../../../data/schemas';
import { useSystemState } from '../../../providers/SystemStateProvider';
import styles from '../Risk.module.scss';

interface ActionCopy {
  readonly title: string;
  readonly word: string;
  readonly explanation: string;
  readonly button: string;
}

const COPY: Readonly<Record<EmergencyActionDto, ActionCopy>> = {
  stop_automation: {
    title: 'Stop all automation',
    word: 'STOP',
    explanation:
      'No strategy may raise or place orders until automation is resumed. Orders already at a broker are not touched.',
    button: 'Stop all automation',
  },
  resume_automation: {
    title: 'Resume automation',
    word: 'RESUME',
    explanation: 'Strategies may raise and place orders again, within their stages and limits.',
    button: 'Resume automation',
  },
  cancel_working_orders: {
    title: 'Cancel all working orders',
    word: 'CANCEL',
    explanation:
      'Every pending and partly filled order is cancelled, and approvals still waiting are withdrawn. An unconfirmed order cannot be cancelled until the broker confirms it exists.',
    button: 'Cancel all working orders',
  },
};

// UI spec 7.14 — emergency controls, visually separated, with confirmation steps: a reason, then
// the exact word typed, before anything happens.
export function EmergencyControls(): ReactElement {
  const system = useSystemState();
  const emergency = useEmergencyAction();
  const orders = useOrderHistory();
  const [action, setAction] = useState<EmergencyActionDto | null>(null);
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');

  const working = (orders.data ?? []).filter(
    (order) => order.status === 'pending' || order.status === 'partially_filled',
  ).length;
  const unconfirmed = (orders.data ?? []).filter((order) => order.status === 'unconfirmed').length;
  const copy = action === null ? null : COPY[action];
  const canConfirm =
    copy !== null && reason.trim() !== '' && typed.trim().toUpperCase() === copy.word;

  const open = (next: EmergencyActionDto): void => {
    setAction(next);
    setReason('');
    setTyped('');
  };
  const close = (): void => {
    setAction(null);
  };

  const confirm = (): void => {
    if (action === null) return;
    emergency.mutate(
      { action, reason: reason.trim() },
      {
        onSuccess: () => {
          // The top bar reads the same state, so the two can never disagree.
          const shouldStop = action === 'stop_automation';
          if (action !== 'cancel_working_orders' && system.isAutomationStopped !== shouldStop) {
            system.toggleAutomationStop();
          }
          close();
        },
      },
    );
  };

  return (
    <section className={styles.emergency} aria-labelledby="emergency-controls">
      <h2 id="emergency-controls" className={styles.emergencyTitle}>
        Emergency controls
      </h2>
      <p className={styles.note}>
        Each asks for a reason and a typed word before it acts, and every use is recorded.
      </p>

      <div className={styles.emergencyGrid}>
        <div className={styles.emergencyItem}>
          <span className={styles.inline}>
            <span className={styles.title}>Automation</span>
            <Badge variant={system.isAutomationStopped ? 'critical' : 'positive'}>
              {system.isAutomationStopped ? 'Stopped' : 'Running'}
            </Badge>
          </span>
          <p className={styles.meta}>
            {system.isAutomationStopped
              ? `No strategy is raising or placing orders. Resuming means: ${COPY.resume_automation.explanation}`
              : `Strategies are trading within their stages and limits. Stopping means: ${COPY.stop_automation.explanation}`}
          </p>
          <span className={styles.inline}>
            <Button
              variant={system.isAutomationStopped ? 'secondary' : 'danger'}
              onPress={() => {
                open(system.isAutomationStopped ? 'resume_automation' : 'stop_automation');
              }}
            >
              {system.isAutomationStopped ? 'Resume automation…' : 'Stop all automation…'}
            </Button>
          </span>
        </div>

        <div className={styles.emergencyItem}>
          <span className={styles.inline}>
            <span className={styles.title}>Working orders</span>
            <Badge variant={working > 0 ? 'warning' : 'neutral'}>{String(working)} working</Badge>
          </span>
          <p className={styles.meta}>
            {COPY.cancel_working_orders.explanation}
            {unconfirmed > 0 ? ` ${String(unconfirmed)} unconfirmed right now.` : ''}
          </p>
          <span className={styles.inline}>
            <Button
              variant="danger"
              isDisabled={working === 0}
              onPress={() => {
                open('cancel_working_orders');
              }}
            >
              Cancel all working orders…
            </Button>
          </span>
        </div>
      </div>

      {action !== null && copy !== null && (
        <Modal
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) close();
          }}
          title={copy.title}
          footer={
            <div className={styles.dialogActions}>
              <Button variant="secondary" onPress={close}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isDisabled={!canConfirm}
                isLoading={emergency.isPending}
                onPress={confirm}
              >
                {copy.button}
              </Button>
            </div>
          }
        >
          <div className={styles.dialogBody}>
            <p className={styles.note}>{copy.explanation}</p>
            {action === 'cancel_working_orders' && (
              <p className={styles.warning}>
                {String(working)} order{working === 1 ? '' : 's'} will be cancelled.
              </p>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Reason</span>
              <textarea
                className={styles.textarea}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                }}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Type {copy.word} to confirm</span>
              <input
                className={styles.input}
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                }}
              />
            </label>
            {emergency.isError && <p className={styles.warning}>{emergency.error.message}</p>}
          </div>
        </Modal>
      )}
    </section>
  );
}
