// Create a strategy (T-02): name it, then start blank, from a starter template or from a copy of an
// existing strategy. The new strategy is always a draft and opens in the editor.

import { Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateStrategy, useStrategies, useStrategyTemplates } from '../../../data/api';
import type { StrategySourceDto } from '../../../data/schemas';
import { CreateStrategyRequestSchema } from '../../../data/schemas';
import { strategyEditorPath } from '../../../routes/routes';
import { toStrategyId } from '../../../shared/types/identifiers';
import { StartingPointList } from './StartingPointList';
import styles from './CreateStrategy.module.scss';

export interface CreateStrategyDialogProps {
  readonly onClose: () => void;
  // Opens with "copy this strategy" chosen, as the library's Duplicate action does.
  readonly duplicateOf?: { readonly id: string; readonly name: string };
}

// The starting point as the form holds it: a template or strategy id beside its kind.
export type StartingPoint =
  | { readonly kind: 'blank' }
  | { readonly kind: 'template'; readonly id: string }
  | { readonly kind: 'duplicate'; readonly id: string };

function toSource(start: StartingPoint): StrategySourceDto {
  if (start.kind === 'blank') return { kind: 'blank' };
  if (start.kind === 'template') return { kind: 'template', templateId: start.id };
  return { kind: 'duplicate', strategyId: toStrategyId(start.id) };
}

export function CreateStrategyDialog({
  onClose,
  duplicateOf,
}: CreateStrategyDialogProps): ReactElement {
  const templates = useStrategyTemplates();
  const strategies = useStrategies();
  const create = useCreateStrategy();
  const navigate = useNavigate();

  const [name, setName] = useState(duplicateOf === undefined ? '' : `${duplicateOf.name} copy`);
  const [description, setDescription] = useState('');
  const [start, setStart] = useState<StartingPoint>(
    duplicateOf === undefined
      ? { kind: 'template', id: 'tpl-trend-following' }
      : { kind: 'duplicate', id: duplicateOf.id },
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  // The same schema the server checks, so the form cannot pass what the server would refuse.
  const request = { name, description, source: toSource(start) };
  const parsed = CreateStrategyRequestSchema.safeParse(request);
  const nameError = parsed.success
    ? null
    : (parsed.error.issues.find((issue) => issue.path[0] === 'name')?.message ?? null);

  const submit = (): void => {
    setIsSubmitted(true);
    if (!parsed.success) return;
    create.mutate(parsed.data, {
      onSuccess: (draft) => {
        onClose();
        void navigate(strategyEditorPath(String(draft.strategyId)));
      },
    });
  };

  const footer = (
    <div className={styles.actions}>
      <Button variant="secondary" onPress={onClose}>
        Cancel
      </Button>
      <Button isDisabled={create.isPending} onPress={submit}>
        {create.isPending ? 'Creating' : 'Create and open in editor'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="New strategy"
      footer={footer}
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input
            className={styles.input}
            value={name}
            aria-invalid={isSubmitted && nameError !== null}
            placeholder="For example: Nifty trend follower"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          {isSubmitted && nameError !== null && <span className={styles.error}>{nameError}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>What is it for? (optional)</span>
          <input
            className={styles.input}
            value={description}
            placeholder="One line you will recognise later"
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </label>

        <StartingPointList
          start={start}
          onChange={setStart}
          templates={templates}
          strategies={strategies}
        />

        {create.isError && (
          <p role="alert" className={styles.error}>
            Not created: {create.error.message}
          </p>
        )}
        <p className={styles.note}>
          A new strategy starts as a draft. It cannot trade until it is backtested and promoted.
        </p>
      </form>
    </Modal>
  );
}
