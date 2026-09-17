import { Badge, Card, PartialDataState, Tabs } from '@staysteady/ui';
import type { PartialDataSource } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { createMoney } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { IsoUtcTimestamp } from '../../../../shared/types/dateTime';
import { PriceFreshnessBar } from '../../../../shared/ui/PriceFreshnessBar';
import { describeExit } from '../../holdings/model/holdingRows';
import type { HoldingRow } from '../../holdings/model/holdingTypes';
import { LotsTable } from '../../holdings/sections/LotsTable';
import styles from '../PositionPage.module.scss';
import { usePositionEdits } from '../usePositionEdits';
import { usePositionLedger } from '../usePositionLedger';
import { CostsIncomePanel } from './CostsIncomePanel';
import { EventsPanel } from './EventsPanel';
import { NewsPanel } from './NewsPanel';
import { PositionActions } from './PositionActions';
import { PositionChartCard } from './PositionChartCard';
import { PositionDisposalEstimator } from './PositionDisposalEstimator';
import { PositionHeader } from './PositionHeader';
import { StrategyNotesPanel } from './StrategyNotesPanel';
import { TransactionsPanel } from './TransactionsPanel';

export interface PositionViewProps {
  readonly row: HoldingRow;
  readonly baseCurrency: BaseCurrencyCode;
  readonly heldMarketIds: ReadonlySet<string>;
  readonly oldestQuoteTimestamp: IsoUtcTimestamp | null;
  readonly unavailable: readonly PartialDataSource[];
  readonly onRetry: () => void;
}

export function PositionView({
  row,
  baseCurrency,
  heldMarketIds,
  oldestQuoteTimestamp,
  unavailable,
  onRetry,
}: PositionViewProps): ReactElement {
  const { instrument } = row;
  const { edits, actions } = usePositionEdits(instrument.id);
  const ledger = usePositionLedger(instrument.id, instrument.currency, edits.manualTransactions);
  const entries = useMemo(() => (ledger.status === 'ready' ? ledger.entries : []), [ledger]);
  const exit = useMemo(
    () =>
      edits.exitLevel === null
        ? row.exit
        : describeExit(createMoney(edits.exitLevel, row.lastPrice.currency), row.lastPrice),
    [edits.exitLevel, row.exit, row.lastPrice],
  );

  const tabs = [
    {
      id: 'lots',
      label: 'Lots',
      badge: <Badge variant="neutral">{row.lots.length}</Badge>,
      content: <LotsTable lots={row.lots} symbol={instrument.symbol} />,
    },
    {
      id: 'tax-disposal',
      label: 'Tax & Disposal',
      badge: <Badge variant="neutral">Est.</Badge>,
      content: <PositionDisposalEstimator row={row} />,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      content: (
        <TransactionsPanel
          ledger={ledger}
          symbol={instrument.symbol}
          onRemoveManual={actions.removeManualTransaction}
        />
      ),
    },
    {
      id: 'costs-income',
      label: 'Costs and income',
      content: <CostsIncomePanel ledger={ledger} row={row} baseCurrency={baseCurrency} />,
    },
    {
      id: 'news',
      label: 'News',
      content: <NewsPanel instrumentId={instrument.id} symbol={instrument.symbol} />,
    },
    {
      id: 'events',
      label: 'Events',
      content: (
        <EventsPanel
          instrumentId={instrument.id}
          marketId={instrument.marketId}
          marketName={row.marketName}
        />
      ),
    },
    {
      id: 'strategy-notes',
      label: 'Strategy and notes',
      content: (
        <StrategyNotesPanel row={row} notes={edits.notes} onRemoveNote={actions.removeNote} />
      ),
    },
  ];

  return (
    <div className={styles.layout}>
      <PriceFreshnessBar
        oldestQuoteTimestamp={oldestQuoteTimestamp}
        heldMarketIds={heldMarketIds}
      />
      {unavailable.length > 0 && <PartialDataState unavailable={unavailable} onRetry={onRetry} />}
      <PositionActions
        row={row}
        exit={exit}
        closeRequestedAt={edits.closeRequestedAt}
        actions={actions}
      />
      <PositionHeader row={row} exit={exit} isExitEdited={edits.exitLevel !== null} />
      <PositionChartCard row={row} exit={exit} ledger={entries} />
      <Card title="Position details">
        <Tabs items={tabs} aria-label={`${instrument.symbol} position details`} />
      </Card>
    </div>
  );
}
