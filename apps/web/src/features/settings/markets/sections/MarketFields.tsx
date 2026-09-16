import { cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { MarketConfigInput } from '../../../../data/schemas';
import { FieldError } from '../../../../shared/config';
import styles from '../../Settings.module.scss';
import { parseTime, timeText } from '../model/marketDraft';

type Time = MarketConfigInput['regularHours'][number]['start'];

export interface SectionProps {
  readonly draft: MarketConfigInput;
  readonly isNew: boolean;
  // Every change names the field it touched, so its error can be shown from then on.
  readonly update: (path: string, change: (draft: MarketConfigInput) => MarketConfigInput) => void;
  readonly error: (path: string) => string | undefined;
}

// Text, number and select fields are shared by every configuration area (shared/config); only the
// market-hours time field is particular to markets.
export function TimeField({
  label,
  value,
  onChange,
  error,
}: {
  readonly label: string;
  readonly error: string | undefined;
  readonly value: Time;
  readonly onChange: (value: Time) => void;
}): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="time"
        className={cx(styles.input, error === undefined ? undefined : styles.invalid)}
        value={timeText(value)}
        aria-invalid={error !== undefined}
        onChange={(event) => {
          const next = parseTime(event.target.value);
          if (next !== null) onChange(next);
        }}
      />
      <FieldError message={error} />
    </label>
  );
}
