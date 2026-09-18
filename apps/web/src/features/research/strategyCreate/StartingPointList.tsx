// Where a new strategy starts: blank, a starter template with its idea in plain words, or a copy.

import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { StrategyDto, StrategyTemplateDto } from '../../../data/schemas';
import type { StartingPoint } from './CreateStrategyDialog';
import styles from './CreateStrategy.module.scss';

export interface StartingPointListProps {
  readonly start: StartingPoint;
  readonly onChange: (start: StartingPoint) => void;
  readonly templates: UseQueryResult<StrategyTemplateDto[]>;
  readonly strategies: UseQueryResult<StrategyDto[]>;
}

interface OptionProps {
  readonly isChecked: boolean;
  readonly title: string;
  readonly detail: string;
  readonly hint?: string;
  readonly onSelect: () => void;
}

function Option({ isChecked, title, detail, hint, onSelect }: OptionProps): ReactElement {
  return (
    <label className={isChecked ? `${styles.option} ${styles.optionChecked}` : styles.option}>
      <input type="radio" name="starting-point" checked={isChecked} onChange={onSelect} />
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{title}</span>
        <span className={styles.optionDetail}>{detail}</span>
        {hint !== undefined && <span className={styles.optionHint}>{hint}</span>}
      </span>
    </label>
  );
}

export function StartingPointList({
  start,
  onChange,
  templates,
  strategies,
}: StartingPointListProps): ReactElement {
  const firstStrategy = strategies.data?.[0];
  const copyId =
    start.kind === 'duplicate'
      ? start.id
      : firstStrategy === undefined
        ? ''
        : String(firstStrategy.id);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Start from</legend>

      {templates.isPending && <p className={styles.note}>Loading starter templates</p>}
      {templates.isError && (
        <p className={styles.note}>
          Starter templates are unavailable ({templates.error.message}). You can still start blank
          or copy a strategy.
        </p>
      )}
      {templates.data?.map((template) => (
        <Option
          key={template.id}
          isChecked={start.kind === 'template' && start.id === template.id}
          title={template.name}
          detail={template.idea}
          hint={`Suits: ${template.suitsLabel}`}
          onSelect={() => {
            onChange({ kind: 'template', id: template.id });
          }}
        />
      ))}

      <Option
        isChecked={start.kind === 'blank'}
        title="Blank"
        detail="No conditions yet. Sizing and a stop loss are filled in with cautious defaults."
        onSelect={() => {
          onChange({ kind: 'blank' });
        }}
      />

      {strategies.data !== undefined && strategies.data.length > 0 && (
        <div className={styles.copyRow}>
          <Option
            isChecked={start.kind === 'duplicate'}
            title="Copy an existing strategy"
            detail="Every rule and setting is copied; the copy starts again as a draft."
            onSelect={() => {
              onChange({ kind: 'duplicate', id: copyId });
            }}
          />
          <select
            className={styles.input}
            aria-label="Strategy to copy"
            value={copyId}
            disabled={start.kind !== 'duplicate'}
            onChange={(event) => {
              onChange({ kind: 'duplicate', id: event.target.value });
            }}
          >
            {strategies.data.map((strategy) => (
              <option key={String(strategy.id)} value={String(strategy.id)}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </fieldset>
  );
}
