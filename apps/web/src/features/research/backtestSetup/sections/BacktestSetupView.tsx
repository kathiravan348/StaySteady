import type { ReactElement } from 'react';

import { useDataCoverage } from '../../../../data/api';
import { hasBlockingCheck } from '../model/backtestWarnings';
import type { SetupReady } from '../useBacktestSetup';
import { useBacktestRunControl } from '../useBacktestSetup';
import styles from '../BacktestSetup.module.scss';
import { CapitalAndCostsSection } from './CapitalAndCostsSection';
import { ChecksPanel } from './ChecksPanel';
import { RunPanel } from './RunPanel';
import { StrategyAndRangeSection } from './StrategyAndRangeSection';
import { UniverseSection } from './UniverseSection';

export interface BacktestSetupViewProps {
  readonly setup: SetupReady;
}

export function BacktestSetupView({ setup }: BacktestSetupViewProps): ReactElement {
  const coverage = useDataCoverage(setup.config.instrumentIds);
  const control = useBacktestRunControl();
  const isBlocked = hasBlockingCheck(setup.checks);

  return (
    <div className={styles.page}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <StrategyAndRangeSection
            strategies={setup.strategies}
            strategy={setup.strategy}
            config={setup.config}
            rangePreset={setup.rangePreset}
            onSelectStrategy={setup.selectStrategy}
            onChange={setup.update}
            onRangePreset={setup.setRangePreset}
          />
          <UniverseSection
            instruments={setup.instruments}
            markets={setup.markets}
            config={setup.config}
            coverage={coverage.data ?? []}
            onChange={(instrumentIds) => {
              setup.update({ instrumentIds } as Parameters<typeof setup.update>[0]);
            }}
          />
          <CapitalAndCostsSection
            config={setup.config}
            costDefaults={setup.costDefaults}
            onChange={setup.update}
            onResetCosts={setup.resetCosts}
          />
        </div>
        <div className={styles.column}>
          <ChecksPanel checks={setup.checks} isLoading={setup.isCoverageLoading} />
          <RunPanel
            run={control.run.data}
            isStarting={control.isStarting}
            isCancelling={control.isCancelling}
            isBlocked={isBlocked}
            error={control.error ?? control.run.error?.message ?? null}
            onStart={() => {
              control.start(setup.config);
            }}
            onCancel={control.cancel}
          />
        </div>
      </div>
    </div>
  );
}
