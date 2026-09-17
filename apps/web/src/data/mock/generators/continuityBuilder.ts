// Synthesizes the full continuity view (requirements 28; UI spec 19.1).
// Computes overdue status against configured review periods, tracks inactivity countdown,
// and enforces fail-safe automation pause calculations.

import type {
  ContinuityViewDto,
  EmergencyAccessPlaybookDto,
  InstitutionAccountDto,
  RecoveryLocationDto,
} from '../../schemas/continuity';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { daysBetween } from './reportValuation';

export interface ContinuityInputs {
  readonly today: string;
  readonly now: string;
  readonly institutions: readonly InstitutionAccountDto[];
  readonly recoveryLocations: readonly RecoveryLocationDto[];
  readonly emergencyAccess: EmergencyAccessPlaybookDto;
  readonly inactivityThresholdDays: number;
  readonly lastHeartbeatDate: string;
}

export function buildContinuityView(inputs: ContinuityInputs): ContinuityViewDto {
  const {
    today,
    now,
    institutions,
    recoveryLocations,
    emergencyAccess,
    inactivityThresholdDays,
    lastHeartbeatDate,
  } = inputs;

  const resolvedInstitutions = institutions.map((inst) => {
    const daysSince = Math.max(0, daysBetween(inst.lastConfirmedDate.slice(0, 10), today));
    const isOverdue = daysSince > inst.reviewPeriodDays;
    return {
      ...inst,
      daysSinceConfirmation: daysSince,
      isOverdue,
    };
  });

  const resolvedLocations = recoveryLocations.map((loc) => {
    const daysSince = Math.max(0, daysBetween(loc.lastAuditedDate.slice(0, 10), today));
    const isOverdue = daysSince > loc.auditPeriodDays;
    return {
      ...loc,
      daysSinceAudit: daysSince,
      isOverdue,
    };
  });

  const drillDaysSince = Math.max(0, daysBetween(emergencyAccess.lastTestDate.slice(0, 10), today));
  const drillOverdue = drillDaysSince > emergencyAccess.testIntervalDays;

  const resolvedEmergency: EmergencyAccessPlaybookDto = {
    ...emergencyAccess,
    daysSinceLastTest: drillDaysSince,
    isOverdue: drillOverdue,
  };

  const overdueCount =
    resolvedInstitutions.filter((i) => i.isOverdue).length +
    resolvedLocations.filter((l) => l.isOverdue).length +
    (drillOverdue ? 1 : 0);

  const inactiveDays = Math.max(0, daysBetween(lastHeartbeatDate.slice(0, 10), today));
  const daysUntilPause = Math.max(0, inactivityThresholdDays - inactiveDays);
  const isPaused = daysUntilPause === 0;

  return {
    asOf: toIsoUtcTimestamp(now),
    overdueReviewsCount: overdueCount,
    inactivity: {
      thresholdDays: inactivityThresholdDays,
      inactiveDays,
      daysUntilPause,
      isPaused,
      lastHeartbeatAt: toIsoUtcTimestamp(`${lastHeartbeatDate}T00:00:00.000Z`),
      escalatingAlertDays: [14, 7, 2],
    },
    emergencyAccess: resolvedEmergency,
    institutions: resolvedInstitutions,
    recoveryLocations: resolvedLocations,
  };
}
