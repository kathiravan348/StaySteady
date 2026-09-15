import { Button, Input, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { humanizeToken } from '../../../../shared/format';
import type { CurrencyCode } from '../../../../shared/types/currency';
import type { DraftErrors, ManualTransactionDraft } from '../model/positionEdits';
import {
  isTradeType,
  MANUAL_TRANSACTION_TYPES,
  validateManualTransaction,
} from '../model/positionEdits';
import styles from '../PositionPage.module.scss';

export interface ManualTransactionDialogProps {
  readonly symbol: string;
  readonly currency: CurrencyCode;
  readonly onAdd: (draft: ManualTransactionDraft) => void;
  readonly onClose: () => void;
}

// UI spec 7.3 action — add manual transaction. Amounts are entered in the instrument's currency.
export function ManualTransactionDialog({
  symbol,
  currency,
  onAdd,
  onClose,
}: ManualTransactionDialogProps): ReactElement {
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState<ManualTransactionDraft>({
    type: 'buy',
    date: today,
    quantity: '',
    unitPrice: '',
    fees: '0',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const errors = validateManualTransaction(draft, today);
  const trade = isTradeType(draft.type);

  const update = <K extends keyof ManualTransactionDraft>(
    key: K,
    value: ManualTransactionDraft[K],
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const errorFor = (key: keyof DraftErrors): { errorMessage?: string } => {
    const message = errors[key];
    return submitted && message !== undefined ? { errorMessage: message } : {};
  };

  const save = (): void => {
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      onAdd(draft);
      onClose();
    }
  };

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Add transaction for ${symbol}`}
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={save}>Add transaction</Button>
        </div>
      }
    >
      <div className={styles.form}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Type</span>
            <select
              className={styles.nativeControl}
              value={draft.type}
              onChange={(event) => {
                const next = MANUAL_TRANSACTION_TYPES.find((type) => type === event.target.value);
                if (next !== undefined) update('type', next);
              }}
            >
              {MANUAL_TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeToken(type)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Date</span>
            <input
              type="date"
              className={styles.nativeControl}
              value={draft.date}
              max={today}
              aria-invalid={submitted && errors.date !== undefined}
              onChange={(event) => {
                update('date', event.target.value);
              }}
            />
            {submitted && errors.date !== undefined && (
              <span className={styles.fieldError}>{errors.date}</span>
            )}
          </label>
          {trade && (
            <Input
              label="Quantity"
              value={draft.quantity}
              onChange={(value) => {
                update('quantity', value);
              }}
              inputMode="decimal"
              {...errorFor('quantity')}
            />
          )}
          <Input
            label={trade ? `Price per unit (${currency})` : `Amount (${currency})`}
            value={draft.unitPrice}
            onChange={(value) => {
              update('unitPrice', value);
            }}
            inputMode="decimal"
            {...errorFor('unitPrice')}
          />
          <Input
            label={`Fees (${currency})`}
            value={draft.fees}
            onChange={(value) => {
              update('fees', value);
            }}
            inputMode="decimal"
            {...errorFor('fees')}
          />
        </div>
        <Input
          label="Notes"
          value={draft.notes}
          onChange={(value) => {
            update('notes', value);
          }}
        />
        <p className={styles.meta}>
          Mock phase: the transaction appears in this position for this browser session only.
        </p>
      </div>
    </Modal>
  );
}
