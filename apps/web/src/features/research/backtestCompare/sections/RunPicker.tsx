import { Badge, Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { BacktestResultDto } from '../../../../data/schemas';
import { formatSignedPercent, pluralize } from '../../../../shared/format';
import { MAX_RUNS } from '../model/compareModel';
import styles from '../BacktestCompare.module.scss';

export interface RunPickerProps {
  readonly available: readonly BacktestResultDto[];
  readonly selectedIds: readonly string[];
  readonly onToggle: (backtestId: string) => void;
  readonly onClear: () => void;
}

// UI spec 7.11 — choose two to four saved runs. Once four are picked the rest are disabled rather
// than hidden, so the limit is visible instead of surprising.
export function RunPicker({
  available,
  selectedIds,
  onToggle,
  onClear,
}: RunPickerProps): ReactElement {
  const atLimit = selectedIds.length >= MAX_RUNS;

  return (
    <Card
      title="Runs to compare"
      extra={
        <span className={styles.inline}>
          <span className={styles.meta}>
            {selectedIds.length} of {MAX_RUNS} selected
          </span>
          <button
            type="button"
            className={styles.link}
            disabled={selectedIds.length === 0}
            onClick={onClear}
          >
            Clear
          </button>
        </span>
      }
    >
      <ul className={styles.pickerList}>
        {available.map((result) => {
          const id = String(result.id);
          const isSelected = selectedIds.includes(id);
          const isDisabled = atLimit && !isSelected;
          return (
            <li key={id}>
              <label
                className={cx(
                  styles.pickerOption,
                  isSelected ? styles.pickerOptionSelected : undefined,
                  isDisabled ? styles.pickerOptionDisabled : undefined,
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => {
                    onToggle(id);
                  }}
                />
                <span className={styles.pickerName}>{result.strategyId}</span>
                <span className={styles.pickerMeta}>
                  {result.startDate} to {result.endDate} ·{' '}
                  {pluralize(result.metrics.totalTrades, 'trade')} ·{' '}
                  {formatSignedPercent(result.totalReturnPercent)}
                  {result.hasOutlierDependency && (
                    <>
                      {' '}
                      <Badge variant="warning">Outlier dependent</Badge>
                    </>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {atLimit && (
        <p className={styles.note}>
          Four runs is the maximum. Clear one to compare a different run.
        </p>
      )}
    </Card>
  );
}
