// Scenario modelling (UI spec 7.17): projected outcomes on adjustable assumptions, and the effect of a
// proposed trade before committing. A suggested trade on the allocation screen links here prefilled.

import { ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useInstruments } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Planning.module.scss';
import { LiquidityLadderSection } from './sections/LiquidityLadderSection';
import { ProjectionPanel } from './sections/ProjectionPanel';
import { TradePreviewPanel } from './sections/TradePreviewPanel';

function ScenariosBody(): ReactElement {
  const instruments = useInstruments();
  const [params] = useSearchParams();

  if (instruments.isError) {
    return (
      <ErrorState
        title="Instruments unavailable"
        message={instruments.error.message}
        onRetry={() => {
          void instruments.refetch();
        }}
      />
    );
  }
  if (instruments.data === undefined) return <LoadingState layout="detail" count={2} />;

  return (
    <div className={styles.page}>
      <ProjectionPanel />
      <LiquidityLadderSection />
      <TradePreviewPanel
        instruments={instruments.data}
        initial={{
          instrumentId: params.get('instrument') ?? '',
          side: params.get('side') === 'sell' ? 'sell' : 'buy',
          quantity: params.get('quantity') ?? '',
        }}
      />
    </div>
  );
}

export function PlanningScenariosPage(): ReactElement {
  return (
    <PageShell
      title="Scenarios"
      description="What the portfolio could grow to on your assumptions, and what a trade would cost and change before you make it."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Planning', to: ROUTES.PLANNING_ALLOCATION },
        { label: 'Scenarios' },
      ]}
    >
      <ScenariosBody />
    </PageShell>
  );
}
