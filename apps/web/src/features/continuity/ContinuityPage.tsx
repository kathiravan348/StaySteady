// Continuity & Succession screen (requirements 28; UI spec 19.1).
// Provides institution nominee status, recovery custody material, emergency access route,
// and dormancy fail-safe automation pause controls.

import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useContinuity } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Continuity.module.scss';
import { ContinuityHeader } from './sections/ContinuityHeader';
import { EmergencyAccessDrill } from './sections/EmergencyAccessDrill';
import { InactivityControls } from './sections/InactivityControls';
import { InstitutionRegister } from './sections/InstitutionRegister';
import { RecoveryLocations } from './sections/RecoveryLocations';

function ContinuityBody(): ReactElement {
  const continuity = useContinuity();

  if (continuity.isError) {
    return (
      <ErrorState
        title="Continuity records unavailable"
        message={continuity.error.message}
        onRetry={() => {
          void continuity.refetch();
        }}
      />
    );
  }

  if (continuity.data === undefined) {
    return <LoadingState layout="cards" count={4} />;
  }

  if (continuity.data.institutions.length === 0) {
    return (
      <EmptyState
        title="No continuity records"
        description="Register institution nominees, emergency recovery protocols, and inactivity pause thresholds."
      />
    );
  }

  return (
    <div className={styles.page}>
      <ContinuityHeader continuity={continuity.data} />
      <InstitutionRegister institutions={continuity.data.institutions} />
      <RecoveryLocations locations={continuity.data.recoveryLocations} />
      <EmergencyAccessDrill playbook={continuity.data.emergencyAccess} />
      <InactivityControls inactivity={continuity.data.inactivity} />
    </div>
  );
}

export function ContinuityPage(): ReactElement {
  return (
    <PageShell
      title="Continuity & Succession"
      description="What happens if you are not here: institution nominees, emergency access playbook, recovery material custody, and inactivity fail-safe."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Continuity & Succession' },
      ]}
    >
      <ContinuityBody />
    </PageShell>
  );
}
