import { Button, Input, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import styles from '../WorkspacePage.module.scss';

export interface TextNoteDialogProps {
  readonly onSave: (text: string) => void;
  readonly onClose: () => void;
}

const MAX_LENGTH = 80;

// Text for a chart note drawing (UI spec 7.4 drawing tools).
export function TextNoteDialog({ onSave, onClose }: TextNoteDialogProps): ReactElement {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Add chart note"
      footer={
        <div className={styles.buttonGroup}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            isDisabled={trimmed === ''}
            onPress={() => {
              onSave(trimmed);
              onClose();
            }}
          >
            Add note
          </Button>
        </div>
      }
    >
      <Input
        label="Note text"
        value={text}
        maxLength={MAX_LENGTH}
        description={`Up to ${MAX_LENGTH} characters, shown on the chart.`}
        onChange={setText}
      />
    </Modal>
  );
}
