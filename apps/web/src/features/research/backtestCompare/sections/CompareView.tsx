import { EmptyState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { BacktestResultDto } from '../../../../data/schemas';
import type { ComparedRun } from '../model/compareModel';
import { MIN_RUNS } from '../model/compareModel';
import { CurveOverlay } from './CurveOverlay';
import { MetricComparisonTable } from './MetricComparisonTable';
import { RunPicker } from './RunPicker';
import { SettingsDiff } from './SettingsDiff';
import styles from '../BacktestCompare.module.scss';

export interface CompareViewProps {
  readonly available: readonly BacktestResultDto[];
  readonly selectedIds: readonly string[];
  readonly runs: readonly ComparedRun[];
  readonly onToggle: (backtestId: string) => void;
  readonly onClear: () => void;
}

// UI spec 7.11 — the picker stays visible above the comparison so runs can be swapped without
// losing your place.
export function CompareView({
  available,
  selectedIds,
  runs,
  onToggle,
  onClear,
}: CompareViewProps): ReactElement {
  return (
    <div className={styles.page}>
      <RunPicker
        available={available}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onClear={onClear}
      />
      {runs.length < MIN_RUNS ? (
        <EmptyState
          title="Pick at least two runs"
          description="A comparison needs two runs so the curves, metrics and settings have something to be measured against."
        />
      ) : (
        <>
          <CurveOverlay runs={runs} />
          <MetricComparisonTable runs={runs} />
          <SettingsDiff runs={runs} />
        </>
      )}
    </div>
  );
}
