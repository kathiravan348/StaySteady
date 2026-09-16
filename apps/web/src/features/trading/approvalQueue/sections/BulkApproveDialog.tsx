import { Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto } from '../../../../data/api';
import type { ApprovalRequestDto } from '../../../../data/schemas';
import { formatMoney } from '../../../../shared/format';
import styles from '../ApprovalQueue.module.scss';

export interface BulkApproveDialogProps {
  readonly requests: readonly ApprovalRequestDto[];
  readonly isBusy: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

const CONFIRM_WORD = 'APPROVE';

// UI spec 7.12 — bulk approval is deliberately restricted. Every order is listed, anything that
// failed a risk check is called out, and the reader types the word before it will act.
export function BulkApproveDialog({
  requests,
  isBusy,
  onClose,
  onConfirm,
}: BulkApproveDialogProps): ReactElement {
  const [typed, setTyped] = useState('');
  const failing = requests.filter((request) =>
    request.riskChecks.some((check) => check.status === 'failed'),
  );
  const simulated = requests.filter((request) => request.isSimulated);
  const canConfirm = typed.trim().toUpperCase() === CONFIRM_WORD && !isBusy;

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Approve ${String(requests.length)} orders at once`}
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="danger" isDisabled={!canConfirm} isLoading={isBusy} onPress={onConfirm}>
            Approve all {String(requests.length)}
          </Button>
        </div>
      }
    >
      <div className={styles.dialogBody}>
        <p className={styles.note}>
          Approving in bulk means not reading each one. Every order below will be sent as proposed.
        </p>

        <ul className={styles.checkList}>
          {requests.map((request) => (
            <li key={request.approvalId} className={styles.checkRow}>
              <span className={styles.checkLabel}>
                {request.side} {String(request.quantity)} {request.instrumentSymbol}
              </span>
              <p className={styles.checkDetail}>
                {formatMoney(moneyFromDto(request.impact.estimatedCost))}
                {request.isSimulated ? ' · simulated' : ''}
              </p>
            </li>
          ))}
        </ul>

        {failing.length > 0 && (
          <p className={styles.reason}>
            <strong>
              {failing.length === 1
                ? '1 order failed a risk check'
                : `${String(failing.length)} orders failed a risk check`}
              :
            </strong>{' '}
            {failing.map((request) => request.instrumentSymbol).join(', ')}. Approving in bulk
            overrides those checks.
          </p>
        )}

        {simulated.length > 0 && (
          <p className={styles.meta}>
            {simulated.length === requests.length
              ? 'Every order here is simulated and will not reach a broker.'
              : `${String(simulated.length)} of these ${simulated.length === 1 ? 'is' : 'are'} simulated and will not reach a broker.`}
          </p>
        )}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Type {CONFIRM_WORD} to confirm</span>
          <input
            className={styles.input}
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
            }}
          />
        </label>
      </div>
    </Modal>
  );
}
