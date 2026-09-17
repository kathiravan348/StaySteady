// Assembles the ComplianceView DTO for S-33 (requirements 27; UI spec 19.1).

import type {
  EmployerPolicy,
  BlackoutWindow,
  CompliancePolicyOverview,
  ComplianceView,
  DisclosureObligation,
  HoldingPeriodLock,
  RefusalRecord,
  RestrictedInstrument,
} from '../../schemas/compliance';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { addDays } from './reportValuation';
import {
  seedBlackoutWindows,
  seedDisclosures,
  seedHoldingLocks,
  seedRefusals,
  seedRestrictedInstruments,
} from './complianceSeeds';

export interface BuildComplianceOptions {
  readonly today: string;
  readonly restrictedInstruments?: readonly RestrictedInstrument[];
  readonly blackoutWindows?: readonly BlackoutWindow[];
  readonly holdingLocks?: readonly HoldingPeriodLock[];
  readonly refusals?: readonly RefusalRecord[];
  readonly disclosures?: readonly DisclosureObligation[];
  readonly policyLastReviewedDate?: string;
  readonly employerPolicy?: EmployerPolicy;
}

// The mock owner's demonstration policy; outside the mock phase it starts disabled (decision 43).
export const SEED_EMPLOYER_POLICY: EmployerPolicy = {
  enabled: true,
  employerName: 'Northwind Systems',
  preClearanceRequired: true,
  minimumHoldingDays: 30,
};

export function buildComplianceView(options: BuildComplianceOptions): ComplianceView {
  const { today } = options;
  const restricted = options.restrictedInstruments ?? seedRestrictedInstruments(today);
  const blackouts = options.blackoutWindows ?? seedBlackoutWindows(today);
  const locks = options.holdingLocks ?? seedHoldingLocks(today);
  const refusals = options.refusals ?? seedRefusals(today);
  const disclosures = options.disclosures ?? seedDisclosures(today);

  const lastReviewed = options.policyLastReviewedDate
    ? toIsoUtcTimestamp(options.policyLastReviewedDate)
    : toIsoUtcTimestamp(`${addDays(today, -45)}T00:00:00.000Z`);

  const nextReviewDue = toIsoUtcTimestamp(`${addDays(today, 320)}T00:00:00.000Z`);
  const anyRestrictedOverdue = restricted.some((item) => item.isReviewOverdue);

  const activeBlackoutCount = blackouts.filter((w) => w.status === 'ACTIVE').length;

  const overview: CompliancePolicyOverview = {
    policyVersion: 'v4.2 (2026 Edition)',
    lastReviewedDate: lastReviewed,
    nextReviewDueDate: nextReviewDue,
    daysUntilReviewDue: 320,
    isReviewOverdue: anyRestrictedOverdue,
    activeBlackoutCount,
    restrictedInstrumentsCount: restricted.length,
    activeLocksCount: locks.length,
    preClearanceEnforced:
      (options.employerPolicy ?? SEED_EMPLOYER_POLICY).enabled &&
      (options.employerPolicy ?? SEED_EMPLOYER_POLICY).preClearanceRequired,
    employerPolicy: options.employerPolicy ?? SEED_EMPLOYER_POLICY,
  };

  return {
    overview,
    restrictedInstruments: [...restricted],
    blackoutWindows: [...blackouts],
    holdingLocks: [...locks],
    refusals: [...refusals],
    disclosures: [...disclosures],
  };
}
