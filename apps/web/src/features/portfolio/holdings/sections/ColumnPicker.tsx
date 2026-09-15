import type { VisibilityState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import styles from '../HoldingsPage.module.scss';
import type { HoldingColumnOption } from '../model/holdingsExport';

export interface ColumnPickerProps {
  readonly options: readonly HoldingColumnOption[];
  readonly visibility: VisibilityState;
  readonly onChange: (visibility: VisibilityState) => void;
}

// UI spec 7.2 and 9 — user-selectable columns. A native disclosure keeps it keyboard accessible.
export function ColumnPicker({ options, visibility, onChange }: ColumnPickerProps): ReactElement {
  return (
    <details className={styles.picker}>
      <summary className={styles.toolbarButton}>Columns</summary>
      <fieldset className={styles.pickerPanel}>
        <legend className={styles.visuallyHidden}>Visible columns</legend>
        {options
          .filter((option) => option.pickable)
          .map((option) => (
            <label key={option.id} className={styles.pickerOption}>
              <input
                type="checkbox"
                checked={visibility[option.id] !== false}
                onChange={(event) => {
                  onChange({ ...visibility, [option.id]: event.target.checked });
                }}
              />
              {option.label}
            </label>
          ))}
      </fieldset>
    </details>
  );
}
