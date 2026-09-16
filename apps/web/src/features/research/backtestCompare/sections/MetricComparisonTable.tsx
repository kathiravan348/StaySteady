import { Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ComparedRun, MetricComparisonRow } from '../model/compareModel';
import { compareMetrics } from '../model/compareModel';
import styles from '../BacktestCompare.module.scss';

export interface MetricComparisonTableProps {
  readonly runs: readonly ComparedRun[];
}

function cellClass(row: MetricComparisonRow, runId: string): string | undefined {
  if (row.bestRunIds.includes(runId)) return styles.best;
  if (row.worstRunIds.includes(runId)) return styles.worst;
  return undefined;
}

// Best and worst are named in the cell, not only coloured, so the ranking survives a colour-blind
// reader, a printout and the red-up gain/loss setting. Runs that tie are all marked: two runs at
// the same value are equally best.
function marker(row: MetricComparisonRow, runId: string): string | null {
  if (row.bestRunIds.includes(runId)) return 'best';
  if (row.worstRunIds.includes(runId)) return 'worst';
  return null;
}

// UI spec 7.11 — the same metrics as the results screen, one column per run, with the gap between
// the strongest and weakest run in the last column.
export function MetricComparisonTable({ runs }: MetricComparisonTableProps): ReactElement {
  const rows = compareMetrics(runs);

  return (
    <Card title="Metrics side by side">
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.meta}>
            Best and worst are marked per row. Higher is better except for drawdown, costs and
            reliance on the largest trades.
          </caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {runs.map((run) => (
                <th key={String(run.result.id)} scope="col" className={styles.numeric}>
                  {run.label}
                </th>
              ))}
              <th scope="col" className={styles.numeric}>
                Spread
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {row.values.map((value) => {
                  const tag = marker(row, value.runId);
                  return (
                    <td
                      key={value.runId}
                      className={cx(styles.numeric, cellClass(row, value.runId))}
                    >
                      {value.display}
                      {tag !== null && <span className={styles.marker}>{tag}</span>}
                    </td>
                  );
                })}
                <td className={styles.numeric}>{row.spread}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
