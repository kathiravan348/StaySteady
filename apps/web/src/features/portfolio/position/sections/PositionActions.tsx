import { Badge, Button } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { formatDateTime } from '../../../../shared/format';
import { toIsoUtcTimestamp } from '../../../../shared/types/dateTime';
import type { ExitInfo, HoldingRow } from '../../holdings/model/holdingTypes';
import { ClosePositionDialog } from '../dialogs/ClosePositionDialog';
import { ExitLevelDialog } from '../dialogs/ExitLevelDialog';
import { ManualTransactionDialog } from '../dialogs/ManualTransactionDialog';
import { NoteDialog } from '../dialogs/NoteDialog';
import styles from '../PositionPage.module.scss';
import type { PositionEditActions } from '../usePositionEdits';

export interface PositionActionsProps {
  readonly row: HoldingRow;
  readonly exit: ExitInfo | null;
  readonly closeRequestedAt: string | null;
  readonly actions: PositionEditActions;
}

type OpenDialog = 'exit' | 'close' | 'transaction' | 'note' | null;

// UI spec 7.3 actions: adjust exit level, close position, add manual transaction, add note.
export function PositionActions({
  row,
  exit,
  closeRequestedAt,
  actions,
}: PositionActionsProps): ReactElement {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = (): void => {
    setDialog(null);
  };
  const { symbol } = row.instrument;

  return (
    <div className={styles.toolbar}>
      <Button variant="secondary" onPress={() => setDialog('exit')}>
        Adjust exit level
      </Button>
      <Button variant="secondary" onPress={() => setDialog('transaction')}>
        Add transaction
      </Button>
      <Button variant="secondary" onPress={() => setDialog('note')}>
        Add note
      </Button>
      {closeRequestedAt === null ? (
        <Button variant="danger" onPress={() => setDialog('close')}>
          Close position
        </Button>
      ) : (
        <span className={styles.inline}>
          <Badge variant="warning">
            Close requested{' '}
            {formatDateTime(toIsoUtcTimestamp(closeRequestedAt), { includeSeconds: false })}, not
            sent (mock)
          </Badge>
          <Button variant="ghost" onPress={actions.withdrawClose}>
            Withdraw request
          </Button>
        </span>
      )}

      {dialog === 'exit' && (
        <ExitLevelDialog row={row} current={exit} onSave={actions.setExitLevel} onClose={close} />
      )}
      {dialog === 'close' && (
        <ClosePositionDialog row={row} onConfirm={actions.requestClose} onClose={close} />
      )}
      {dialog === 'transaction' && (
        <ManualTransactionDialog
          symbol={symbol}
          currency={row.instrument.currency}
          onAdd={actions.addManualTransaction}
          onClose={close}
        />
      )}
      {dialog === 'note' && <NoteDialog symbol={symbol} onAdd={actions.addNote} onClose={close} />}
    </div>
  );
}
