import { Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { ApprovalDecisionDto, ApprovalRequestDto } from '../../../../data/schemas';
import styles from '../ApprovalQueue.module.scss';

export type DecisionMode = 'approve' | 'modify' | 'reject';

export interface DecisionDialogProps {
  readonly request: ApprovalRequestDto;
  readonly mode: DecisionMode;
  readonly isBusy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (decision: ApprovalDecisionDto) => void;
}

// Modifying is approving a changed order, so the change and the decision travel together. A reason is
// always asked for, and required when rejecting or when the safeguards require one (requirements 29):
// it goes into the decision journal beside the outcome.
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
  const needsReason = mode === 'reject' || request.reasonRequired;
  const hasReason = !needsReason || reason.trim() !== '';
  const canSubmit =
    !isBusy && hasReason && (mode !== 'modify' || (isQuantityValid && isPriceValid));

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
    const isModify = mode === 'modify';
    onSubmit({
      decision: 'approved',
      reason: reason.trim() === '' ? null : reason.trim(),
      modifiedQuantity:
        !isModify || parsedQuantity === Number(request.quantity) ? null : parsedQuantity,
      modifiedLimitPrice:
        !isModify || limitPrice === '' || limitPrice === request.limitPrice?.amount
          ? null
          : limitPrice,
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
          ? `${request.status === 'approved' ? 'Withdraw' : 'Reject'} ${request.side} ${request.instrumentSymbol}`
          : mode === 'approve'
            ? `Approve ${request.side} ${request.instrumentSymbol}`
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
            {mode === 'reject'
              ? 'Reject with reason'
              : mode === 'approve'
                ? 'Approve'
                : 'Approve with changes'}
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
        ) : mode === 'reject' ? (
          <p className={styles.note}>
            This order will not be placed. The reason is kept with the decision so the same proposal
            can be judged against it later.
          </p>
        ) : (
          <p className={styles.note}>
            {String(request.quantity)} units as proposed
            {request.coolingOff === null
              ? '.'
              : `; it then waits ${String(request.coolingOff.minutes)} minutes before it may be placed.`}
          </p>
        )}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            {mode === 'reject' ? 'Why reject it' : 'Why approve it'}
            {needsReason ? '' : ' (optional)'}
          </span>
          <textarea
            className={styles.textarea}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
          <span className={styles.meta}>
            Kept in the decision journal and shown beside the outcome later.
          </span>
        </label>
      </div>
    </Modal>
  );
}
