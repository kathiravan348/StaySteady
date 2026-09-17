import { Button } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRecordValuation } from '../../../data/api';
import type { NetWorthAssetRowDto, ReportCurrencyDto } from '../../../data/schemas';
import { RecordValuationRequestSchema } from '../../../data/schemas';
import { DateField, TextField, errorsByPath } from '../../../shared/config';
import styles from '../NetWorth.module.scss';

// A new value for one record, with its date and whether it was checked against a statement.
export function RecordValuationForm({
  row,
  currency,
}: {
  readonly row: NetWorthAssetRowDto;
  readonly currency: ReportCurrencyDto;
}): ReactElement {
  const today = new Date().toISOString().slice(0, 10);
  const record = useRecordValuation(currency);
  const [draft, setDraft] = useState({
    value: row.currentValue.amount,
    valuedOn: today,
    verified: row.asset.verified,
  });
  const [submitted, setSubmitted] = useState(false);
  const parsed = RecordValuationRequestSchema.safeParse(draft);
  const errors = errorsByPath(parsed.success ? undefined : parsed.error);
  const future = draft.valuedOn > today ? 'A valuation cannot be dated in the future' : undefined;
  const shown = (path: 'value' | 'valuedOn'): string | undefined =>
    submitted ? (path === 'valuedOn' ? (errors[path] ?? future) : errors[path]) : undefined;
  const isLiability = row.asset.category === 'liability';

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!parsed.success || future !== undefined) return;
        record.mutate({ id: row.asset.id, valuation: parsed.data });
      }}
    >
      <span className={styles.label}>Record a new valuation</span>
      <div className={styles.fieldGrid}>
        <TextField
          label={`${isLiability ? 'Amount owed' : 'Value'} (${row.asset.currency})`}
          value={draft.value}
          error={shown('value')}
          onChange={(value) => {
            setDraft({ ...draft, value });
          }}
        />
        <DateField
          label="Valued on"
          value={draft.valuedOn}
          error={shown('valuedOn')}
          onChange={(valuedOn) => {
            setDraft({ ...draft, valuedOn });
          }}
        />
        <label className={styles.checkOption}>
          <input
            type="checkbox"
            checked={draft.verified}
            onChange={(event) => {
              setDraft({ ...draft, verified: event.target.checked });
            }}
          />
          Checked against a statement or valuer
        </label>
      </div>
      <span className={styles.inline}>
        <Button type="submit" variant="secondary" isDisabled={record.isPending}>
          {record.isPending ? 'Saving…' : 'Save valuation'}
        </Button>
        {record.isSuccess && <span className={styles.meta}>Saved.</span>}
        {record.isError && <span className={styles.warning}>{record.error.message}</span>}
      </span>
    </form>
  );
}
