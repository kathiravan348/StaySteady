import { Button, KeyValuePair, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useSystemState } from '../../../../providers/SystemStateProvider';
import {
  formatMoney,
  formatNumber,
  formatSignedMoney,
  humanizeToken,
  pluralize,
} from '../../../../shared/format';
import { describeTaxStatus } from '../../holdings/model/holdingTax';
import type { HoldingRow } from '../../holdings/model/holdingTypes';
import styles from '../PositionPage.module.scss';

export interface ClosePositionDialogProps {
  readonly row: HoldingRow;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

function taxWarning(row: HoldingRow): string | null {
  switch (row.tax.kind) {
    case 'approaching':
      return `Selling now is taxed as short term. Waiting ${pluralize(row.tax.daysToLongTerm, 'day')} would make it long term.`;
    case 'short-term':
      return 'Selling now is taxed as short term.';
    case 'mixed':
      return 'Some lots are still short term and would be taxed as such.';
    case 'long-term':
    case 'not-applicable':
      return null;
  }
}

// UI spec 7.3 action — close position. Irreversible actions confirm first (UI spec 5).
export function ClosePositionDialog({
  row,
  onConfirm,
  onClose,
}: ClosePositionDialogProps): ReactElement {
  const { mode } = useSystemState();
  const warning = taxWarning(row);

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Close ${row.instrument.symbol} position?`}
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onPress={onClose}>
            Keep position
          </Button>
          <Button
            variant="danger"
            onPress={() => {
              onConfirm();
              onClose();
            }}
          >
            Request close
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <div className={styles.keyValues}>
          <KeyValuePair
            label="Quantity to sell"
            value={formatNumber(row.quantity, { decimals: Number.isInteger(row.quantity) ? 0 : 4 })}
          />
          <KeyValuePair
            label="Estimated proceeds"
            value={`${formatMoney(row.valueLocal, { showCurrency: 'code' })} (${formatMoney(row.valueBase)})`}
          />
          <KeyValuePair label="Estimated gain or loss" value={formatSignedMoney(row.gainBase)} />
          <KeyValuePair label="Tax status" value={describeTaxStatus(row.tax)} />
        </div>
        {warning !== null && (
          <p className={styles.warning} role="note">
            {warning}
          </p>
        )}
        <p className={styles.meta}>
          Mode: {humanizeToken(mode)}. Mock phase: no order is sent to a broker. The request is
          recorded in this browser session only, at the last price shown.
        </p>
      </div>
    </Modal>
  );
}
