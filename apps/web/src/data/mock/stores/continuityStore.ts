// In-memory continuity and emergency access store for the mock session (decisions 33 and 37).
// Retains nominee confirmations, recorded drills, and inactivity configuration adjustments.

import type {
  EmergencyAccessPlaybookDto,
  EmergencyDrillRecordDto,
  InstitutionAccountDto,
  RecoveryLocationDto,
} from '../../schemas/continuity';
import {
  seedEmergencyPlaybook,
  seedInstitutions,
  seedRecoveryLocations,
} from '../generators/continuitySeeds';
import { addDays } from '../generators/reportValuation';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';

interface ContinuityStoreState {
  institutions: InstitutionAccountDto[];
  recoveryLocations: RecoveryLocationDto[];
  emergencyAccess: EmergencyAccessPlaybookDto;
  inactivityThresholdDays: number;
  lastHeartbeatDate: string;
}

let state: ContinuityStoreState | null = null;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function initStore(): ContinuityStoreState {
  const today = getTodayString();
  return {
    institutions: [...seedInstitutions(today)],
    recoveryLocations: [...seedRecoveryLocations(today)],
    emergencyAccess: seedEmergencyPlaybook(today),
    inactivityThresholdDays: 30,
    lastHeartbeatDate: addDays(today, -12),
  };
}

function ensureState(): ContinuityStoreState {
  if (state === null) {
    state = initStore();
  }
  return state;
}

export const getContinuityStore = (): ContinuityStoreState => ensureState();

export const confirmNomineeInStore = (institutionId: string, now: string): void => {
  const s = ensureState();
  const inst = s.institutions.find((item) => item.id === institutionId);
  if (inst !== undefined) {
    inst.lastConfirmedDate = toIsoUtcTimestamp(now);
    inst.isOverdue = false;
    inst.daysSinceConfirmation = 0;
  }
};

export const recordDrillInStore = (
  drill: Omit<EmergencyDrillRecordDto, 'id' | 'drillDate'>,
  now: string,
): void => {
  const s = ensureState();
  const newRecord: EmergencyDrillRecordDto = {
    id: `drill-${String(Date.now())}`,
    drillDate: toIsoUtcTimestamp(now),
    ...drill,
  };
  s.emergencyAccess = {
    ...s.emergencyAccess,
    lastTestDate: toIsoUtcTimestamp(now),
    isOverdue: false,
    daysSinceLastTest: 0,
    drillHistory: [newRecord, ...s.emergencyAccess.drillHistory],
  };
};

export const updateAccessPlanInStore = (plan: {
  nominatedPerson: string;
  backupNominee: string;
  testIntervalDays: number;
}): void => {
  const s = ensureState();
  s.emergencyAccess = { ...s.emergencyAccess, ...plan };
};

export const updateInactivityInStore = (thresholdDays: number): void => {
  const s = ensureState();
  s.inactivityThresholdDays = thresholdDays;
};

export const resetHeartbeatInStore = (today: string): void => {
  const s = ensureState();
  s.lastHeartbeatDate = today;
};
