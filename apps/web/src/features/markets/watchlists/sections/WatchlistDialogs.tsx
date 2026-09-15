import { Button, Input, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { WatchlistDto } from '../../../../data/schemas';
import { WatchlistNameSchema } from '../../../../data/schemas';
import { pluralize } from '../../../../shared/format';
import styles from '../Watchlists.module.scss';

interface DialogBaseProps {
  readonly onClose: () => void;
  readonly isBusy: boolean;
  readonly serverError: string | null;
}

export interface WatchlistNameDialogProps extends DialogBaseProps {
  readonly title: string;
  readonly submitLabel: string;
  readonly initialName: string;
  readonly onSubmit: (name: string) => void;
}

// Create or rename a watchlist. The same schema validates here and in the API.
export function WatchlistNameDialog(props: WatchlistNameDialogProps): ReactElement {
  const [name, setName] = useState(props.initialName);
  const [touched, setTouched] = useState(false);
  const parsed = WatchlistNameSchema.safeParse(name);
  const error = parsed.success ? null : (parsed.error.issues[0]?.message ?? 'Invalid name');
  const message = (touched ? error : null) ?? props.serverError;

  const submit = (): void => {
    setTouched(true);
    if (parsed.success) props.onSubmit(parsed.data);
  };

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={props.title}
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" onPress={props.onClose}>
            Cancel
          </Button>
          <Button isLoading={props.isBusy} onPress={submit}>
            {props.submitLabel}
          </Button>
        </div>
      }
    >
      <Input
        label="Watchlist name"
        value={name}
        maxLength={40}
        onChange={(value) => {
          setName(value);
          setTouched(true);
        }}
        {...(message === null ? {} : { errorMessage: message })}
      />
    </Modal>
  );
}

export interface DeleteWatchlistDialogProps extends DialogBaseProps {
  readonly list: WatchlistDto;
  readonly onConfirm: () => void;
}

export function DeleteWatchlistDialog(props: DeleteWatchlistDialogProps): ReactElement {
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={`Delete ${props.list.name}?`}
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" onPress={props.onClose}>
            Keep list
          </Button>
          <Button variant="danger" isLoading={props.isBusy} onPress={props.onConfirm}>
            Delete list
          </Button>
        </div>
      }
    >
      <p className={styles.note}>
        The list and its {pluralize(props.list.instrumentIds.length, 'instrument')} will be removed.
        The instruments themselves stay available to add to other lists.
      </p>
      {props.serverError !== null && (
        <p className={styles.error} role="alert">
          {props.serverError}
        </p>
      )}
    </Modal>
  );
}

export interface MoveInstrumentDialogProps extends DialogBaseProps {
  readonly symbol: string;
  readonly lists: readonly WatchlistDto[];
  readonly onMove: (toListId: string) => void;
}

// Keyboard- and screen-reader-friendly alternative to dragging a row onto another list.
export function MoveInstrumentDialog(props: MoveInstrumentDialogProps): ReactElement {
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={`Move ${props.symbol} to another list`}
      footer={
        <Button variant="secondary" onPress={props.onClose}>
          Cancel
        </Button>
      }
    >
      <ul className={styles.results}>
        {props.lists.map((list) => (
          <li key={list.id} className={styles.resultRow}>
            <span>{list.name}</span>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={props.isBusy}
              onPress={() => props.onMove(list.id)}
            >
              Move here
            </Button>
          </li>
        ))}
      </ul>
      {props.serverError !== null && (
        <p className={styles.error} role="alert">
          {props.serverError}
        </p>
      )}
    </Modal>
  );
}
