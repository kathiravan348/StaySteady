// Statement-derived screener filters (R-13; UI spec 20.2): debt to equity, return on capital
// employed, three-year revenue growth and cash conversion, from the same measures the company
// research screen shows. A company without statements cannot pass any of them.

import type { ReactElement } from 'react';

import type { ScreenerFilterCriteria } from '../../../../data/schemas/screener';
import styles from '../Screener.module.scss';

type StatementFilterKey = 'maxDebtToEquity' | 'minRoce' | 'minRevenueGrowth' | 'minCashConversion';

const FIELDS: readonly {
  readonly key: StatementFilterKey;
  readonly label: string;
  readonly placeholder: string;
  readonly step: string;
}[] = [
  { key: 'maxDebtToEquity', label: 'Max debt to equity', placeholder: 'e.g. 1.0', step: '0.1' },
  { key: 'minRoce', label: 'Min ROCE (%)', placeholder: 'e.g. 12', step: '1' },
  {
    key: 'minRevenueGrowth',
    label: 'Min revenue growth, 3y (%)',
    placeholder: 'e.g. 8',
    step: '1',
  },
  { key: 'minCashConversion', label: 'Min cash conversion (%)', placeholder: 'e.g. 80', step: '5' },
];

export function ScreenerStatementFilters({
  filters,
  onChange,
}: {
  readonly filters: ScreenerFilterCriteria;
  readonly onChange: (key: StatementFilterKey, value: number | null) => void;
}): ReactElement {
  return (
    <fieldset className={`${styles.gridFilters} ${styles.statementFilters}`}>
      <legend className={styles.fieldLabel}>
        From reported statements (companies without statements are left out when set)
      </legend>
      {FIELDS.map((field) => (
        <div key={field.key} className={styles.field}>
          <label htmlFor={`scr-filter-${field.key}`} className={styles.fieldLabel}>
            {field.label}
          </label>
          <input
            id={`scr-filter-${field.key}`}
            className={styles.input}
            type="number"
            step={field.step}
            placeholder={field.placeholder}
            value={filters[field.key] ?? ''}
            onChange={(event) => {
              const raw = event.target.value;
              onChange(field.key, raw === '' ? null : Number(raw));
            }}
          />
        </div>
      ))}
    </fieldset>
  );
}
