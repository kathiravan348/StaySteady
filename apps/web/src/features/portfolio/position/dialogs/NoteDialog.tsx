import { Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import styles from '../PositionPage.module.scss';

export interface NoteDialogProps {
  readonly symbol: string;
  readonly onAdd: (text: string) => void;
  readonly onClose: () => void;
}

const MAX_NOTE_LENGTH = 2000;

// UI spec 7.3 action — add note.
export function NoteDialog({ symbol, onAdd, onClose }: NoteDialogProps): ReactElement {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Add note for ${symbol}`}
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            isDisabled={trimmed === ''}
            onPress={() => {
              onAdd(trimmed);
              onClose();
            }}
          >
            Save note
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Note</span>
          <textarea
            className={styles.textarea}
            value={text}
            maxLength={MAX_NOTE_LENGTH}
            rows={5}
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
          <span className={styles.meta}>
            {text.length} of {MAX_NOTE_LENGTH} characters. Kept in this browser session only.
          </span>
        </label>
      </div>
    </Modal>
  );
}
