// Screen S-33: Compliance — employer and jurisdictional restrictions (requirements 27; UI spec 19.1).
// Enforces restricted lists, blackout windows, pre-clearance, and holding period locks at signal stage.

import type { ReactElement } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@staysteady/ui';

import {
  useAddRestrictedInstrument,
  useCheckEligibility,
  useCompliance,
  useConfirmPolicyReview,
  useRemoveRestrictedInstrument,
} from '../../data/api/complianceQueries';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Compliance.module.scss';
import { BlackoutWindowsSection } from './sections/BlackoutWindowsSection';
import { ComplianceBanner } from './sections/ComplianceBanner';
import { DisclosuresSection } from './sections/DisclosuresSection';
import { EmployerPolicyCard } from './sections/EmployerPolicyCard';
import { InstrumentEligibilityChecker } from './sections/InstrumentEligibilityChecker';
import { MinimumHoldingSection } from './sections/MinimumHoldingSection';
import { RefusalsLogSection } from './sections/RefusalsLogSection';
import { RestrictedListSection } from './sections/RestrictedListSection';

function ComplianceBody(): ReactElement {
  const { data: compliance, isLoading, isError, error, refetch } = useCompliance();
  const checkMutation = useCheckEligibility();
  const addRestrictedMutation = useAddRestrictedInstrument();
  const removeRestrictedMutation = useRemoveRestrictedInstrument();
  const confirmReviewMutation = useConfirmPolicyReview();

  if (isLoading) {
    return <LoadingState layout="cards" count={4} />;
  }

  if (isError || !compliance) {
    return (
      <ErrorState
        title="Compliance configuration unavailable"
        message={
          error?.message ?? 'Failed to load personal compliance records and policy restrictions.'
        }
        onRetry={() => void refetch()}
      />
    );
  }

  const isEmpty =
    compliance.restrictedInstruments.length === 0 &&
    compliance.blackoutWindows.length === 0 &&
    compliance.holdingLocks.length === 0 &&
    compliance.refusals.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title="No compliance restrictions configured"
        description="No restricted instruments, blackout windows, or holding locks are currently active."
      />
    );
  }

  return (
    <div className={styles.page}>
      <ComplianceBanner
        overview={compliance.overview}
        onConfirmReview={() => void confirmReviewMutation.mutate()}
        isConfirming={confirmReviewMutation.isPending}
      />

      <EmployerPolicyCard
        key={JSON.stringify(compliance.overview.employerPolicy)}
        policy={compliance.overview.employerPolicy}
      />

      <InstrumentEligibilityChecker
        onCheck={async (symbol, action) => {
          return await checkMutation.mutateAsync({ symbol, action });
        }}
        isChecking={checkMutation.isPending}
      />

      <RestrictedListSection
        instruments={compliance.restrictedInstruments}
        onAdd={async (input) => {
          await addRestrictedMutation.mutateAsync(input);
        }}
        onRemove={async (id) => {
          await removeRestrictedMutation.mutateAsync(id);
        }}
        isMutating={addRestrictedMutation.isPending || removeRestrictedMutation.isPending}
      />

      <div className={styles.gridTwo}>
        <BlackoutWindowsSection windows={compliance.blackoutWindows} />
        <MinimumHoldingSection locks={compliance.holdingLocks} />
      </div>

      <RefusalsLogSection refusals={compliance.refusals} />

      <DisclosuresSection disclosures={compliance.disclosures} />
    </div>
  );
}

export function CompliancePage(): ReactElement {
  return (
    <PageShell
      title="Compliance & Restrictions"
      description="Employer trading policy, blackout windows, pre-clearance, and signal-stage enforcement."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Compliance & Restrictions' },
      ]}
    >
      <ComplianceBody />
    </PageShell>
  );
}
