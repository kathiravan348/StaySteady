// In-memory mock store for S-33 Compliance (requirements 27; UI spec 19.1; decisions 33, 37).
// Manages policy configuration, restricted instruments, holding locks, and real-time eligibility evaluation.

import type {
  AddRestrictedInstrumentInput,
  BlackoutWindow,
  ComplianceView,
  DisclosureObligation,
  EligibilityCheckResult,
  HoldingPeriodLock,
  RefusalRecord,
  RestrictedInstrument,
} from '../../schemas/compliance';
import { toIsoUtcTimestamp } from '../../../shared/types/dateTime';
import { buildComplianceView } from '../generators/complianceBuilder';
import {
  seedBlackoutWindows,
  seedDisclosures,
  seedHoldingLocks,
  seedRefusals,
  seedRestrictedInstruments,
} from '../generators/complianceSeeds';
import { addDays } from '../generators/reportValuation';

const DEFAULT_TODAY = '2026-09-17';

let todayDate = DEFAULT_TODAY;
let restrictedList: RestrictedInstrument[] = [...seedRestrictedInstruments(DEFAULT_TODAY)];
let blackouts: BlackoutWindow[] = [...seedBlackoutWindows(DEFAULT_TODAY)];
let locks: HoldingPeriodLock[] = [...seedHoldingLocks(DEFAULT_TODAY)];
let refusalsList: RefusalRecord[] = [...seedRefusals(DEFAULT_TODAY)];
let disclosuresList: DisclosureObligation[] = [...seedDisclosures(DEFAULT_TODAY)];
let policyReviewedDate = `${addDays(DEFAULT_TODAY, -45)}T00:00:00.000Z`;

export function getComplianceStoreView(): ComplianceView {
  return buildComplianceView({
    today: todayDate,
    restrictedInstruments: restrictedList,
    blackoutWindows: blackouts,
    holdingLocks: locks,
    refusals: refusalsList,
    disclosures: disclosuresList,
    policyLastReviewedDate: policyReviewedDate,
  });
}

export function evaluateEligibility(
  symbolInput: string,
  action: 'BUY' | 'SELL',
): EligibilityCheckResult {
  const symbol = symbolInput.trim().toUpperCase();

  // 1. Check Restricted List
  const restrictedMatch = restrictedList.find((item) => item.symbol.toUpperCase() === symbol);
  if (restrictedMatch) {
    const reasons = [
      `Instrument ${symbol} is on the Restricted List (${restrictedMatch.reasonCategory}).`,
      `Policy: ${restrictedMatch.policyClause}`,
    ];
    return {
      symbol,
      action,
      status: 'REFUSED',
      rule: 'restricted_list',
      primaryReason: `Restricted List Violation: ${restrictedMatch.name}`,
      policyClause: restrictedMatch.policyClause,
      details: restrictedMatch.notes,
      restrictionsTriggered: reasons,
      preClearanceRequired: false,
    };
  }

  // 2. Check Active Blackout Windows
  const activeBlackout = blackouts.find((b) => {
    if (b.status !== 'ACTIVE') return false;
    // Check if blackout scope applies
    if (b.scope.includes('Northwind') && symbol === 'NORTHWIND') return true;
    if (
      b.scope.includes('Enterprise Cloud Software') &&
      ['MSFT', 'ORCL', 'CRM', 'NOW'].includes(symbol)
    ) {
      return true;
    }
    if (b.scope.includes('All Global Equities')) return true;
    return false;
  });

  if (activeBlackout) {
    return {
      symbol,
      action,
      status: 'REFUSED',
      rule: 'blackout',
      primaryReason: `Active Blackout Window: ${activeBlackout.name}`,
      policyClause: activeBlackout.policyReference,
      details: `${activeBlackout.notes} Window expires in ${activeBlackout.daysRemaining} days.`,
      restrictionsTriggered: [
        `Active window: ${activeBlackout.name}`,
        `Mandatory quiet period in effect until ${activeBlackout.endDate.slice(0, 10)}`,
      ],
      preClearanceRequired: activeBlackout.preClearanceRequired,
    };
  }

  // 3. If action is SELL, check Minimum Holding Period Lock
  if (action === 'SELL') {
    const lockMatch = locks.find((l) => l.symbol.toUpperCase() === symbol && l.daysRemaining > 0);
    if (lockMatch) {
      return {
        symbol,
        action,
        status: 'REFUSED',
        rule: 'holding_lock',
        primaryReason: `Minimum Holding Period Lock Active (${lockMatch.daysRemaining} days remaining)`,
        policyClause: lockMatch.ruleReference,
        details: `Disposal locked until ${lockMatch.unlockDate.slice(0, 10)}. Policy prevents short-term round trips (${lockMatch.minimumHoldingDays}-day minimum).`,
        restrictionsTriggered: [
          `Holding lock on ${lockMatch.quantity} shares purchased on ${lockMatch.acquisitionDate.slice(0, 10)}`,
          `Minimum holding requirement: ${lockMatch.minimumHoldingDays} days`,
        ],
        preClearanceRequired: false,
      };
    }
  }

  // Permitted
  return {
    symbol,
    action,
    status: 'ALLOWED',
    rule: null,
    primaryReason: 'Trading Permitted',
    policyClause: 'Staff Personal Account Dealing Guidelines §1.0',
    details:
      'No active restricted list entries, blackout quiet periods, or holding period locks apply to this instrument.',
    restrictionsTriggered: [],
    preClearanceRequired: false,
  };
}

export function addRestrictedInstrumentToStore(
  input: AddRestrictedInstrumentInput,
): ComplianceView {
  const newId = `res-${Date.now()}`;
  const newItem: RestrictedInstrument = {
    id: newId,
    symbol: input.symbol,
    name: input.name,
    assetClass: input.assetClass,
    jurisdiction: input.jurisdiction,
    reasonCategory: input.reasonCategory,
    policyClause: input.policyClause,
    effectiveFrom: toIsoUtcTimestamp(`${todayDate}T00:00:00.000Z`),
    reviewDueDate: toIsoUtcTimestamp(`${addDays(todayDate, 365)}T00:00:00.000Z`),
    isReviewOverdue: false,
    notes: input.notes,
    addedBy: 'User (Manual Entry)',
  };

  restrictedList = [newItem, ...restrictedList];
  return getComplianceStoreView();
}

export function removeRestrictedInstrumentFromStore(id: string): ComplianceView {
  restrictedList = restrictedList.filter((item) => item.id !== id);
  return getComplianceStoreView();
}

export function confirmPolicyReviewInStore(): ComplianceView {
  policyReviewedDate = `${todayDate}T00:00:00.000Z`;
  // Reset overdue status on instruments
  restrictedList = restrictedList.map((item) => {
    if (item.isReviewOverdue) {
      return {
        ...item,
        isReviewOverdue: false,
        reviewDueDate: toIsoUtcTimestamp(`${addDays(todayDate, 365)}T00:00:00.000Z`),
      };
    }
    return item;
  });
  return getComplianceStoreView();
}

export function resetComplianceStore(today = DEFAULT_TODAY): void {
  todayDate = today;
  restrictedList = [...seedRestrictedInstruments(today)];
  blackouts = [...seedBlackoutWindows(today)];
  locks = [...seedHoldingLocks(today)];
  refusalsList = [...seedRefusals(today)];
  disclosuresList = [...seedDisclosures(today)];
  policyReviewedDate = `${addDays(today, -45)}T00:00:00.000Z`;
}
