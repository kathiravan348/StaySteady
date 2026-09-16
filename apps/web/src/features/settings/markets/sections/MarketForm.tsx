import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { useSaveMarketConfig } from '../../../../data/api';
import type { MarketConfigInput } from '../../../../data/schemas';
import { MarketConfigSchema } from '../../../../data/schemas';
import { SimulationNotice, errorsByPath, visibleError } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { MarketCalendarSection, MarketRulesSection } from './MarketCalendarRules';
import { MarketHoursSection, MarketIdentitySection } from './MarketIdentityHours';

export interface MarketFormProps {
  readonly initial: MarketConfigInput;
  readonly isNew: boolean;
  readonly onSaved: (marketId: string) => void;
  readonly onCancel: () => void;
}

// UI spec 7.18 — the detail form for adding or editing. Validation runs on every change with the same
// schema the server uses, and errors appear beside a field once it has been touched.
export function MarketForm({ initial, isNew, onSaved, onCancel }: MarketFormProps): ReactElement {
  const save = useSaveMarketConfig();
  const [draft, setDraft] = useState<MarketConfigInput>(initial);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('');

  const result = useMemo(() => MarketConfigSchema.safeParse(draft), [draft]);
  const errors = errorsByPath(result.success ? undefined : result.error);
  const errorCount = Object.keys(errors).length;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const error = (path: string): string | undefined =>
    visibleError(errors, path, touched, submitted);

  const update = (
    path: string,
    change: (current: MarketConfigInput) => MarketConfigInput,
  ): void => {
    setDraft(change);
    setTouched((current) => new Set([...current, path]));
  };

  const submit = (): void => {
    setSubmitted(true);
    if (errorCount > 0 || reason.trim() === '') return;
    save.mutate(
      { isNew, config: draft, reason: reason.trim() },
      {
        onSuccess: () => {
          onSaved(draft.marketId);
        },
      },
    );
  };

  const sectionProps = { draft, isNew, update, error };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.inline}>
          <strong className={styles.note}>
            {isNew ? 'New market' : `${initial.name} (${initial.marketId})`}
          </strong>
          {isDirty && <Badge variant="warning">Unsaved changes</Badge>}
        </span>
      </div>

      {isNew && <SimulationNotice subject="market" />}

      <MarketIdentitySection {...sectionProps} />
      <MarketHoursSection {...sectionProps} />
      <MarketCalendarSection {...sectionProps} />
      <MarketRulesSection {...sectionProps} />

      <Card title={isNew ? 'Add this market' : 'Save changes'}>
        {submitted && errorCount > 0 && (
          <div className={styles.errorSummary} role="alert">
            <p className={styles.warning}>
              {errorCount === 1
                ? '1 field needs fixing'
                : `${String(errorCount)} fields need fixing`}{' '}
              before this can be saved.
            </p>
            <ul className={styles.rowList}>
              {Object.entries(errors).map(([path, message]) => (
                <li key={path} className={styles.meta}>
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Reason for this change (kept with the version)</span>
          <input
            className={styles.input}
            value={reason}
            aria-invalid={submitted && reason.trim() === ''}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
        </label>
        {submitted && reason.trim() === '' && (
          <p className={styles.warning}>Say why this is changing.</p>
        )}
        {save.isError && <p className={styles.warning}>{save.error.message}</p>}
        <span className={styles.inline}>
          <Button isDisabled={!isNew && !isDirty} isLoading={save.isPending} onPress={submit}>
            {isNew ? 'Add market in simulation' : 'Save as a new version'}
          </Button>
          <Button variant="secondary" isDisabled={save.isPending} onPress={onCancel}>
            {isNew ? 'Cancel' : 'Discard changes'}
          </Button>
        </span>
      </Card>
    </div>
  );
}
