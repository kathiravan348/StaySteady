// Net Worth (requirements 25; UI spec 19.1): the complete picture, market and non-market together.

import { Button, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useNetWorth } from '../../data/api';
import { useSystemState } from '../../providers/SystemStateProvider';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './NetWorth.module.scss';
import { blankAsset } from './model/netWorthLabels';
import { AddAssetForm } from './sections/AddAssetForm';
import { AssetRegister } from './sections/AssetRegister';
import { ConcentrationSection, LiquiditySection } from './sections/ExposureSections';
import { NetWorthSummary } from './sections/NetWorthSummary';

function NetWorthBody(): ReactElement {
  const { baseCurrency } = useSystemState();
  const netWorth = useNetWorth(baseCurrency);
  const [isAdding, setIsAdding] = useState(false);
  const addForm = isAdding ? (
    <AddAssetForm
      initial={blankAsset(new Date().toISOString().slice(0, 10))}
      currency={baseCurrency}
      onDone={() => {
        setIsAdding(false);
      }}
    />
  ) : (
    <span>
      <Button
        variant="secondary"
        onPress={() => {
          setIsAdding(true);
        }}
      >
        Add an asset or liability
      </Button>
    </span>
  );

  if (netWorth.isError) {
    return (
      <ErrorState
        title="Net worth unavailable"
        message={netWorth.error.message}
        onRetry={() => {
          void netWorth.refetch();
        }}
      />
    );
  }
  if (netWorth.data === undefined) return <LoadingState layout="cards" count={4} />;
  const view = netWorth.data;
  if (view.assets.length === 0 && view.brokerage.holdings === 0) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Nothing recorded yet"
          description="Add what you own outside the brokers — savings, deposits, gold, property, employer equity — and what you owe, to see your whole net worth."
        />
        {addForm}
      </div>
    );
  }
  return (
    <div className={styles.page}>
      <NetWorthSummary view={view} />
      <div className={styles.columns}>
        <LiquiditySection view={view} />
        <ConcentrationSection view={view} />
      </div>
      <AssetRegister view={view} />
      {addForm}
    </div>
  );
}

export function NetWorthPage(): ReactElement {
  return (
    <PageShell
      title="Net worth"
      description="Everything you own and owe — the brokerage portfolio and what is held elsewhere — with how liquid and how concentrated it is."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Net worth' }]}
    >
      <NetWorthBody />
    </PageShell>
  );
}
