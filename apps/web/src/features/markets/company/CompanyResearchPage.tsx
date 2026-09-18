// Company Research screen (UI spec 20.1): the end-to-end picture of the company behind an
// instrument, before any money is committed. Tabs load and fail on their own; the Overview tab
// answers "what am I buying" without scrolling.

import { EmptyState, ErrorState, LoadingState, Tabs } from '@staysteady/ui';
import type { TabItemConfig } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useInstruments } from '../../../data/api';
import { ROUTES, workspaceTickerPath } from '../../../routes/routes';
import { PageShell } from '../../../shell/PageShell';
import styles from './CompanyResearch.module.scss';
import { FinancialsTab } from './sections/FinancialsTab';
import { FlagsSection } from './sections/FlagsSection';
import { NewsEventsTab } from './sections/NewsEventsTab';
import { OwnershipTab } from './sections/OwnershipTab';
import { ProfileSection } from './sections/ProfileSection';
import { RatiosTab } from './sections/RatiosTab';
import { StandingSection } from './sections/StandingSection';

function OverviewTab({ instrumentId }: { readonly instrumentId: string }): ReactElement {
  return (
    <div className={styles.stack}>
      <ProfileSection instrumentId={instrumentId} />
      <StandingSection instrumentId={instrumentId} />
      <FlagsSection instrumentId={instrumentId} />
    </div>
  );
}

export function CompanyResearchPage(): ReactElement {
  const { instrumentId = '' } = useParams<{ instrumentId?: string }>();
  const instruments = useInstruments();
  const instrument = instruments.data?.find((item) => String(item.id) === instrumentId);

  let body: ReactElement;
  if (instruments.isError) {
    body = (
      <ErrorState
        title="Company research unavailable"
        message={instruments.error.message}
        onRetry={() => {
          void instruments.refetch();
        }}
      />
    );
  } else if (instruments.data === undefined) {
    body = <LoadingState layout="detail" />;
  } else if (instrument === undefined) {
    body = (
      <EmptyState
        title="No instrument with that reference"
        description="Open a company from the screener, your holdings or the instrument workspace."
        action={<Link to={ROUTES.MARKETS_SCREENER}>Go to the screener</Link>}
      />
    );
  } else {
    const tabs: TabItemConfig[] = [
      { id: 'overview', label: 'Overview', content: <OverviewTab instrumentId={instrumentId} /> },
      {
        id: 'financials',
        label: 'Financials',
        content: <FinancialsTab instrumentId={instrumentId} />,
      },
      { id: 'ratios', label: 'Ratios', content: <RatiosTab instrumentId={instrumentId} /> },
      {
        id: 'ownership',
        label: 'Ownership',
        content: <OwnershipTab instrumentId={instrumentId} />,
      },
      {
        id: 'news',
        label: 'News & events',
        content: <NewsEventsTab instrumentId={instrumentId} symbol={instrument.symbol} />,
      },
    ];
    body = (
      <div className={styles.page}>
        <div className={styles.inline}>
          <Link to={workspaceTickerPath(instrument.symbol)}>Open in the workspace</Link>
        </div>
        <Tabs items={tabs} aria-label={`${instrument.symbol} company research`} />
      </div>
    );
  }

  return (
    <PageShell
      title={instrument === undefined ? 'Company research' : `${instrument.symbol} company`}
      description={
        instrument === undefined
          ? 'What the business is, who controls it, what it earns and owes.'
          : `${instrument.name} · ${instrument.marketId} · ${instrument.currency}`
      }
    >
      {body}
    </PageShell>
  );
}
