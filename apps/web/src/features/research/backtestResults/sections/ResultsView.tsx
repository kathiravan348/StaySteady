import { Badge, Tabs } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useStrategies } from '../../../../data/api';
import type { BacktestDetailDto, BacktestResultDto } from '../../../../data/schemas';
import { humanizeToken } from '../../../../shared/format';
import { resultWarnings } from '../model/resultWarnings';
import { useResultEdits } from '../useResultEdits';
import styles from '../BacktestResults.module.scss';
import { BreakdownTab } from './BreakdownTab';
import { CostsTab, ValidationTab } from './CostsAndValidationTabs';
import { EquityAndDrawdown } from './EquityAndDrawdown';
import { HeadlineStrip } from './HeadlineStrip';
import { MetricsTab } from './MetricsTab';
import { ResultActions } from './ResultActions';
import { SummaryTab } from './SummaryTab';
import { TradesTab } from './TradesTab';
import { WarningsPanel } from './WarningsPanel';

export interface ResultsViewProps {
  readonly result: BacktestResultDto;
  readonly detail: BacktestDetailDto;
}

export function ResultsView({ result, detail }: ResultsViewProps): ReactElement {
  const strategies = useStrategies();
  const strategy = strategies.data?.find((item) => item.id === result.strategyId);
  const { edits, actions } = useResultEdits(result.id);
  const warnings = useMemo(() => resultWarnings(result, detail), [result, detail]);
  const criticalCount = warnings.filter((warning) => warning.level === 'critical').length;

  const tabs = [
    {
      id: 'summary',
      label: 'Summary',
      content: <SummaryTab result={result} detail={detail} strategy={strategy} />,
    },
    {
      id: 'trades',
      label: 'Trades',
      content: <TradesTab backtestId={result.id} tradeCount={result.metrics.totalTrades} />,
    },
    { id: 'metrics', label: 'Metrics', content: <MetricsTab detail={detail} /> },
    { id: 'breakdown', label: 'Breakdown', content: <BreakdownTab detail={detail} /> },
    { id: 'costs', label: 'Costs', content: <CostsTab detail={detail} /> },
    {
      id: 'validation',
      label: 'Validation',
      badge: criticalCount > 0 ? <Badge variant="critical">{criticalCount}</Badge> : undefined,
      content: <ValidationTab detail={detail} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.inline}>
        {edits.name !== '' && <Badge variant="info">{edits.name}</Badge>}
        {strategy !== undefined && <Badge variant="neutral">{humanizeToken(strategy.stage)}</Badge>}
        {result.hasOutlierDependency && <Badge variant="warning">Outlier dependent</Badge>}
      </div>
      <HeadlineStrip result={result} detail={detail} />
      <WarningsPanel warnings={warnings} />
      <EquityAndDrawdown detail={detail} />
      <Tabs items={tabs} aria-label="Backtest result detail" />
      <ResultActions result={result} strategy={strategy} edits={edits} actions={actions} />
    </div>
  );
}
