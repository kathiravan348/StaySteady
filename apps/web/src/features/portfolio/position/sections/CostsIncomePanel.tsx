import { ErrorState, LoadingState, MetricDisplay } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useFxHistories, useFxRates } from '../../../../data/api';
import { directionOfNumber, formatMoney, formatSignedMoney } from '../../../../shared/format';
import { createMoney } from '../../../../shared/money';
import type { BaseCurrencyCode } from '../../../../shared/types/currency';
import type { HoldingRow } from '../../holdings/model/holdingTypes';
import { fxSourcesFrom, summariseCosts, summariseIncome } from '../model/positionLedger';
import type { LedgerState } from '../model/positionTypes';
import styles from '../PositionPage.module.scss';
import { CashFlowList } from './CashFlowList';

export interface CostsIncomePanelProps {
  readonly ledger: LedgerState;
  readonly row: HoldingRow;
  readonly baseCurrency: BaseCurrencyCode;
}

// UI spec 7.3 — costs incurred (fees, charges, conversion costs) and income received.
export function CostsIncomePanel({
  ledger,
  row,
  baseCurrency,
}: CostsIncomePanelProps): ReactElement {
  const fxRates = useFxRates();
  const fxHistories = useFxHistories();
  const entries = ledger.status === 'ready' ? ledger.entries : null;

  const summaries = useMemo(() => {
    if (entries === null || fxRates.data === undefined || fxHistories.data === undefined) {
      return null;
    }
    const fx = fxSourcesFrom(fxRates.data, fxHistories.data);
    return {
      costs: summariseCosts(entries, baseCurrency, fx),
      income: summariseIncome(entries, baseCurrency, fx),
    };
  }, [entries, fxRates.data, fxHistories.data, baseCurrency]);

  if (ledger.status === 'error') {
    return (
      <ErrorState
        title="Transactions unavailable"
        message={ledger.message}
        onRetry={ledger.retry}
      />
    );
  }
  if (fxRates.isError || fxHistories.isError) {
    return (
      <ErrorState
        title="Exchange rates unavailable"
        message="Costs and income cannot be converted without exchange rates."
        onRetry={() => {
          void fxRates.refetch();
          void fxHistories.refetch();
        }}
      />
    );
  }
  if (summaries === null) {
    return <LoadingState layout="table" count={4} />;
  }

  const { costs, income } = summaries;
  const afterCosts = row.gainBase.amount
    .minus(costs.totalBase.amount)
    .plus(income.totalBase.amount);

  return (
    <div className={styles.panelStack}>
      <div className={styles.metrics}>
        <MetricDisplay
          label="Total costs"
          value={formatMoney(costs.totalBase)}
          subLabel="Trading fees and conversion charges"
        />
        <MetricDisplay
          label="Total income"
          value={formatMoney(income.totalBase)}
          subLabel="Dividends and payouts"
        />
        <MetricDisplay
          label="Unrealised result after costs and income"
          value={formatSignedMoney(createMoney(afterCosts, baseCurrency))}
          changeValue={formatSignedMoney(row.gainBase)}
          direction={directionOfNumber(afterCosts.toNumber())}
          subLabel="Compared with the unrealised gain or loss alone"
        />
      </div>
      <div className={styles.panelGrid}>
        <CashFlowList title="Costs" summary={costs} emptyText="No fees or charges recorded." />
        <CashFlowList
          title="Income"
          summary={income}
          emptyText="No dividends or payouts recorded."
        />
      </div>
    </div>
  );
}
