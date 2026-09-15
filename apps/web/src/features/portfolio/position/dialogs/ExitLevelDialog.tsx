import { Button, Input, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { formatMoney } from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import { describeExit } from '../../holdings/model/holdingRows';
import type { ExitInfo, HoldingRow } from '../../holdings/model/holdingTypes';
import { validateExitLevel } from '../model/positionEdits';
import styles from '../PositionPage.module.scss';

export interface ExitLevelDialogProps {
  readonly row: HoldingRow;
  readonly current: ExitInfo | null;
  readonly onSave: (level: string | null) => void;
  readonly onClose: () => void;
}

// UI spec 7.3 action — adjust exit level. Shows the distance from the price before saving.
export function ExitLevelDialog({
  row,
  current,
  onSave,
  onClose,
}: ExitLevelDialogProps): ReactElement {
  const { currency } = row.lastPrice;
  const [value, setValue] = useState(current?.level.amount.toFixed() ?? '');
  const error = validateExitLevel(value, row.lastPrice);
  const preview =
    error === null ? describeExit(createMoney(value.trim(), currency), row.lastPrice) : null;
  const showError = value.trim() !== '' && error !== null;

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Adjust exit level for ${row.instrument.symbol}`}
      footer={
        <div className={styles.dialogActions}>
          {current !== null && (
            <Button
              variant="ghost"
              onPress={() => {
                onSave(null);
                onClose();
              }}
            >
              Remove exit level
            </Button>
          )}
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            isDisabled={error !== null}
            onPress={() => {
              onSave(value.trim());
              onClose();
            }}
          >
            Save exit level
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <p className={styles.note}>
          Current price {formatMoney(row.lastPrice, { showCurrency: 'code' })}.{' '}
          {current === null
            ? 'No exit level is set.'
            : `Current exit ${formatMoney(current.level, { showCurrency: 'code' })}.`}
        </p>
        <Input
          label={`Exit price (${currency})`}
          value={value}
          onChange={setValue}
          inputMode="decimal"
          {...(showError ? { errorMessage: error } : {})}
        />
        {preview !== null && (
          <p className={styles.note} aria-live="polite">
            {preview.distancePercent.toFixed(1)}% below the current price
            {preview.proximity === 'near' ? ' — this is close and may trigger soon.' : '.'}
          </p>
        )}
        <p className={styles.meta}>Mock phase: the change applies in this browser session only.</p>
      </div>
    </Modal>
  );
}
