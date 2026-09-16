import { Card, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ComparedRun } from '../model/compareModel';
import { compareSettings } from '../model/compareModel';
import { pluralize } from '../../../../shared/format';
import styles from '../BacktestCompare.module.scss';

export interface SettingsDiffProps {
  readonly runs: readonly ComparedRun[];
}

// UI spec 7.11 — a metric difference only means something if you can see what was configured
// differently, so every setting is listed and the ones that are not identical are flagged.
export function SettingsDiff({ runs }: SettingsDiffProps): ReactElement {
  const rows = compareSettings(runs);
  const changed = rows.filter((row) => row.isDifferent);

  return (
    <Card
      title="What was configured differently"
      extra={
        <span className={styles.meta}>
          {changed.length === 0
            ? 'Identical settings'
            : `${pluralize(changed.length, 'setting')} differ`}
        </span>
      }
    >
      {changed.length === 0 && (
        <p className={styles.note}>
          These runs were configured identically, so any difference in results comes from the data
          or the period rather than the settings.
        </p>
      )}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Setting</th>
              {runs.map((run) => (
                <th key={String(run.result.id)} scope="col">
                  {run.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={cx(row.isDifferent ? styles.changedRow : undefined)}>
                <th scope="row">
                  {row.label}
                  {row.isDifferent && <span className={styles.changedTag}> · changed</span>}
                </th>
                {row.values.map((value) => (
                  <td key={value.runId}>{value.display}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
