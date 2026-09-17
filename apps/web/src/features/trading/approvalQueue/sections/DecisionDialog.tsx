import { Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { ApprovalDecisionDto, ApprovalRequestDto } from '../../../../data/schemas';
import styles from '../ApprovalQueue.module.scss';

export type DecisionMode = 'modify' | 'reject';

export interface DecisionDialogProps {
  readonly request: ApprovalRequestDto;
  readonly mode: DecisionMode;
  readonly isBusy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (decision: ApprovalDecisionDto) => void;
}

// Modifying is approving a changed order, so the change and the decision travel together. Rejecting
// asks for a reason, because a rejection with no reason teaches nothing later (UI spec 7.12).
export function DecisionDialog({
  request,
  mode,
  isBusy,
  onClose,
  onSubmit,
}: DecisionDialogProps): ReactElement {
  const [quantity, setQuantity] = useState(String(request.quantity));
  const [limitPrice, setLimitPrice] = useState(request.limitPrice?.amount ?? '');
  const [reason, setReason] = useState('');

  const parsedQuantity = Number(quantity);
  const isQuantityValid = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const isPriceValid = limitPrice === '' || Number(limitPrice) > 0;
  const canSubmit =
    mode === 'reject' ? reason.trim() !== '' : isQuantityValid && isPriceValid && !isBusy;

  const submit = (): void => {
    if (mode === 'reject') {
      onSubmit({
        decision: 'rejected',
        reason: reason.trim(),
        modifiedQuantity: null,
        modifiedLimitPrice: null,
      });
      return;
    }
    onSubmit({
      decision: 'approved',
      reason: reason.trim() === '' ? null : reason.trim(),
      modifiedQuantity: parsedQuantity === Number(request.quantity) ? null : parsedQuantity,
      modifiedLimitPrice:
        limitPrice === '' || limitPrice === request.limitPrice?.amount ? null : limitPrice,
    });
  };

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        mode === 'reject'
          ? `Reject ${request.side} ${request.instrumentSymbol}`
          : `Modify and approve ${request.side} ${request.instrumentSymbol}`
      }
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            variant={mode === 'reject' ? 'danger' : 'primary'}
            isDisabled={!canSubmit}
            isLoading={isBusy}
            onPress={submit}
          >
            {mode === 'reject' ? 'Reject with reason' : 'Approve with changes'}
          </Button>
        </div>
      }
    >
      <div className={styles.dialogBody}>
        {mode === 'modify' ? (
          <>
            <p className={styles.note}>
              The order was proposed as {String(request.quantity)} units
              {request.limitPrice !== null && ` at ${request.limitPrice.amount}`}. Change what you
              want to approve instead.
            </p>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Quantity</span>
                <input
                  type="number"
                  className={styles.input}
                  min={0}
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                  }}
                />
              </label>
              {request.limitPrice !== null && (
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>
                    Limit price ({request.limitPrice.currency})
                  </span>
                  <input
                    type="number"
                    className={styles.input}
                    min={0}
                    value={limitPrice}
                    onChange={(event) => {
                      setLimitPrice(event.target.value);
                    }}
                  />
                </label>
              )}
            </div>
            {!isQuantityValid && (
              <p className={styles.note}>Quantity must be a number greater than zero.</p>
            )}
          </>
        ) : (
          <p className={styles.note}>
            This order will not be placed. The reason is kept with the decision so the same proposal
            can be judged against it later.
          </p>
        )}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            {mode === 'reject'
              ? 'Reason for rejecting (logged to S-31 Decision Journal):'
              : 'Stated Rationale / Reason (logged to S-31 Decision Journal):'}
          </span>
          <textarea
            className={styles.textarea}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            placeholder="Document your hypothesis, market context, or rationale to evaluate in your 30-day decision journal..."
          />
        </label>
      </div>
    </Modal>
  );
}
