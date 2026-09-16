// In-memory risk state for the page load (decision 33): thresholds the owner has changed, the
// record of every change and emergency action (UI spec 7.14 "recorded"), and breaches that a
// change closed.

import type { RiskBreachDto, RiskChangeDto } from '../../schemas';

const thresholdOverrides = new Map<string, number>();
const changes: RiskChangeDto[] = [];
const resolvedBreaches: RiskBreachDto[] = [];

export function getThresholdOverrides(): ReadonlyMap<string, number> {
  return thresholdOverrides;
}

export function setThreshold(limitId: string, threshold: number): void {
  thresholdOverrides.set(limitId, threshold);
}

export function getRiskChanges(): readonly RiskChangeDto[] {
  return changes;
}

// Newest first, as the change log reads.
export function recordRiskChange(change: RiskChangeDto): void {
  changes.unshift(change);
}

export function getResolvedBreaches(): readonly RiskBreachDto[] {
  return resolvedBreaches;
}

export function recordResolvedBreach(breach: RiskBreachDto): void {
  resolvedBreaches.unshift(breach);
}
