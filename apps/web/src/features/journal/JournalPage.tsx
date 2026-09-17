// Decision Journal (requirements 29; UI spec 19.1): the record of why, alongside the outcome.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useJournal } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { JournalView } from './sections/JournalView';

function JournalBody(): ReactElement {
  const journal = useJournal();
  if (journal.isError) {
    return (
      <ErrorState
        title="Decision journal unavailable"
        message={journal.error.message}
        onRetry={() => {
          void journal.refetch();
        }}
      />
    );
  }
  if (journal.data === undefined) return <LoadingState layout="cards" count={4} />;
  if (journal.data.entries.length === 0) {
    return (
      <EmptyState
        title="No decisions recorded yet"
        description="Manual trades, limit overrides and approval decisions appear here with the reason you gave, and later their outcome."
      />
    );
  }
  return <JournalView journal={journal.data} />;
}

export function JournalPage(): ReactElement {
  return (
    <PageShell
      title="Decision journal"
      description="Your own decisions with the reason you gave at the time, the outcome once it is known, and patterns worth a look."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Decision journal' }]}
    >
      <JournalBody />
    </PageShell>
  );
}
