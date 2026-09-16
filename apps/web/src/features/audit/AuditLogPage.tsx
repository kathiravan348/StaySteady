// Audit log (UI spec 7.20): configuration changes, approvals, orders, signals, limit changes,
// emergency actions and strategy changes, with before and after, time, trigger and reason.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useAuditLog } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import { AuditView } from './sections/AuditView';

function AuditBody(): ReactElement {
  const audit = useAuditLog();

  if (audit.isError) {
    return (
      <ErrorState
        title="Audit log unavailable"
        message={audit.error.message}
        onRetry={() => {
          void audit.refetch();
        }}
      />
    );
  }
  if (audit.data === undefined) return <LoadingState layout="table" count={8} />;
  if (audit.data.length === 0) {
    return (
      <EmptyState
        title="Nothing recorded yet"
        description="Changes, approvals and orders are recorded here as they happen."
      />
    );
  }
  return <AuditView entries={audit.data} />;
}

export function AuditLogPage(): ReactElement {
  return (
    <PageShell
      title="Audit log"
      description="Every change and decision: what changed, before and after, when, what triggered it and why. Trace any order back to the signal that started it."
      breadcrumbs={[{ label: 'Overview', to: ROUTES.OVERVIEW }, { label: 'Audit log' }]}
    >
      <AuditBody />
    </PageShell>
  );
}
