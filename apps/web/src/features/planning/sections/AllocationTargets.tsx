import { Badge, Button, Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto, useSaveAllocationPlan } from '../../../data/api';
import type {
  AllocationDimensionDto,
  AllocationViewDto,
  ReportCurrencyDto,
} from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import type { TargetDraft } from '../model/planningModel';
import {
  DIMENSION_LABELS,
  STATUS,
  applyDraft,
  checkDraft,
  draftFor,
  driftText,
} from '../model/planningModel';
import styles from '../Planning.module.scss';

// UI spec 7.17 — target versus actual for one dimension, with drift beyond tolerance highlighted in
// words, a badge and a bar, and targets editable in place.
export function AllocationTargets({
  view,
  dimension,
  currency,
}: {
  readonly view: AllocationViewDto;
  readonly dimension: AllocationDimensionDto;
  readonly currency: ReportCurrencyDto | null;
}): ReactElement {
  const save = useSaveAllocationPlan(currency);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<TargetDraft>(() => draftFor(view.plan, dimension));
  const [tolerance, setTolerance] = useState(String(view.plan.tolerancePercent));
  const [reason, setReason] = useState('');
  const rows = view.dimensions.find((item) => item.dimension === dimension)?.rows ?? [];
  const check = checkDraft(draft);
  const toleranceValue = Number(tolerance);
  const toleranceError =
    !Number.isFinite(toleranceValue) || toleranceValue < 0.5 || toleranceValue > 25
      ? 'Tolerance must be from 0.5 to 25 points.'
      : null;
  const offTarget = rows.filter((row) => row.status === 'over' || row.status === 'under').length;

  const cancel = (): void => {
    setDraft(draftFor(view.plan, dimension));
    setTolerance(String(view.plan.tolerancePercent));
    setReason('');
    setIsEditing(false);
  };

  return (
    <Card
      title={`By ${DIMENSION_LABELS[dimension].toLowerCase()}`}
      extra={
        <span className={styles.meta}>
          {offTarget === 0
            ? 'Nothing outside tolerance'
            : `${String(offTarget)} outside ±${String(view.plan.tolerancePercent)} points`}
        </span>
      }
    >
      <div className={styles.stack}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{DIMENSION_LABELS[dimension]}</th>
                <th scope="col" className={styles.end}>
                  Value
                </th>
                <th scope="col" className={styles.end}>
                  Actual
                </th>
                <th scope="col" className={styles.end}>
                  Target
                </th>
                <th scope="col">Actual against target</th>
                <th scope="col" className={styles.end}>
                  Drift
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isOff = row.status === 'over' || row.status === 'under';
                return (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    <td className={styles.end}>{formatMoney(moneyFromDto(row.actual))}</td>
                    <td className={styles.end}>{row.actualPercent.toFixed(1)}%</td>
                    <td className={styles.end}>
                      {isEditing ? (
                        <input
                          className={cx(styles.input, styles.narrow)}
                          inputMode="decimal"
                          aria-label={`Target for ${row.label} (%)`}
                          value={draft[row.key] ?? ''}
                          onChange={(event) => {
                            setDraft({ ...draft, [row.key]: event.target.value });
                          }}
                        />
                      ) : row.targetPercent === null ? (
                        '—'
                      ) : (
                        `${row.targetPercent.toFixed(1)}%`
                      )}
                    </td>
                    <td>
                      <div className={styles.bar} aria-hidden="true">
                        <div
                          className={cx(styles.barFill, isOff ? styles.barOff : undefined)}
                          style={{ width: `${String(Math.min(row.actualPercent, 100))}%` }}
                        />
                        {row.targetPercent !== null && (
                          <div
                            className={styles.barTarget}
                            style={{ left: `${String(Math.min(row.targetPercent, 100))}%` }}
                          />
                        )}
                      </div>
                    </td>
                    <td className={styles.end}>{driftText(row)}</td>
                    <td>
                      <Badge variant={STATUS[row.status].variant}>{STATUS[row.status].label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.meta}>The bar is the actual share; the dark tick is the target.</p>

        {isEditing ? (
          <div className={styles.stack}>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tolerance (points either side)</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  value={tolerance}
                  onChange={(event) => {
                    setTolerance(event.target.value);
                  }}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Reason for the change</span>
                <input
                  className={styles.input}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                  }}
                />
              </label>
            </div>
            <p className={check.error === null ? styles.meta : styles.warning}>
              {check.error ??
                (check.total === 0
                  ? `No targets: ${DIMENSION_LABELS[dimension].toLowerCase()} will not be tracked.`
                  : 'Targets add up to 100%.')}
            </p>
            {toleranceError !== null && <p className={styles.warning}>{toleranceError}</p>}
            {save.isError && <p className={styles.warning}>{save.error.message}</p>}
            <span className={styles.inline}>
              <Button
                isDisabled={check.error !== null || toleranceError !== null || reason.trim() === ''}
                isLoading={save.isPending}
                onPress={() => {
                  save.mutate(
                    {
                      plan: applyDraft(view.plan, dimension, draft, toleranceValue),
                      reason: reason.trim(),
                    },
                    {
                      onSuccess: () => {
                        setReason('');
                        setIsEditing(false);
                      },
                    },
                  );
                }}
              >
                Save targets
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  setDraft(Object.fromEntries(rows.map((row) => [row.key, ''])));
                }}
              >
                Clear targets
              </Button>
              <Button variant="secondary" onPress={cancel}>
                Cancel
              </Button>
            </span>
            {reason.trim() === '' && <p className={styles.meta}>A reason is needed to save.</p>}
          </div>
        ) : (
          <span className={styles.inline}>
            <Button
              variant="secondary"
              onPress={() => {
                setIsEditing(true);
              }}
            >
              Edit targets
            </Button>
            <span className={styles.meta}>
              Last changed {new Date(view.savedAt).toLocaleDateString('en-GB')}: {view.savedReason}
            </span>
          </span>
        )}
      </div>
    </Card>
  );
}
