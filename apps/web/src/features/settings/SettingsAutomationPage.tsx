// Automation permission summary (UI spec 7.18; requirements 233): the layered result of market,
// instrument type, broker and strategy together, so it is obvious what can actually trade.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import {
  useBrokerConfigs,
  useInstrumentTypeConfigs,
  useInstruments,
  useMarketConfigs,
  useStrategies,
} from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './automation/Automation.module.scss';
import type { PermissionInputs } from './automation/model/permissionLayers';
import { evaluateCell, strategyPermissions } from './automation/model/permissionLayers';
import { PermissionMatrix } from './automation/sections/PermissionMatrix';
import { StrategyPermissions } from './automation/sections/StrategyPermissions';

function AutomationBody(): ReactElement {
  const markets = useMarketConfigs();
  const brokers = useBrokerConfigs();
  const types = useInstrumentTypeConfigs();
  const strategies = useStrategies();
  const instruments = useInstruments();
  const queries = [markets, brokers, types, strategies, instruments];

  const view = useMemo(() => {
    if (!markets.data || !brokers.data || !types.data || !strategies.data || !instruments.data) {
      return null;
    }
    const inputs: PermissionInputs = {
      markets: markets.data.map((entry) => entry.config),
      brokers: brokers.data.map((entry) => entry.config),
      types: types.data.map((entry) => entry.config),
    };
    const cells = inputs.markets.flatMap((market) =>
      inputs.types.map((type) => evaluateCell(inputs, market.marketId, type.type)),
    );
    return {
      markets: inputs.markets.map((market) => ({ id: market.marketId, name: market.name })),
      cells,
      strategies: strategies.data.map((strategy) => ({
        strategy,
        instruments: strategyPermissions(strategy, instruments.data, inputs),
      })),
    };
  }, [markets.data, brokers.data, types.data, strategies.data, instruments.data]);

  const failed = queries.find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Automation permissions unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          queries.forEach((query) => {
            void query.refetch();
          });
        }}
      />
    );
  }
  if (view === null) return <LoadingState layout="table" count={5} />;
  if (view.markets.length === 0 || view.cells.length === 0) {
    return (
      <EmptyState
        title="Nothing to automate yet"
        description="Configure at least one market and instrument type to see what automation may trade."
      />
    );
  }

  const live = view.cells.filter((cell) => cell.outcome === 'live').length;
  const simulation = view.cells.filter((cell) => cell.outcome === 'simulation').length;
  const trading = view.strategies.filter((row) => row.instruments.some((item) => item.canTrade));
  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Automated live</span>
          <span className={styles.summaryValue}>
            {live} of {view.cells.length} market and type pairs
          </span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Simulation only</span>
          <span className={styles.summaryValue}>{simulation}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.summaryLabel}>Strategies that can trade live</span>
          <span className={styles.summaryValue}>
            {trading.length === 0 ? 'None' : trading.map((row) => row.strategy.name).join(', ')}
          </span>
        </span>
      </div>
      <PermissionMatrix markets={view.markets} cells={view.cells} />
      <StrategyPermissions rows={view.strategies} />
    </div>
  );
}

export function SettingsAutomationPage(): ReactElement {
  return (
    <PageShell
      title="What automation can trade"
      description="Market, instrument type, broker and strategy together: an automated order proceeds only if every layer permits it."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Settings' },
        { label: 'Automation permissions' },
      ]}
    >
      <AutomationBody />
    </PageShell>
  );
}
