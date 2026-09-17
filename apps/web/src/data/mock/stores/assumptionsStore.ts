// In-memory planning assumptions and operating policy for the page load (E-09; decisions 33, 37 and
// 41). Versions are full snapshots, newest first, like every other configuration area.

import type {
  InflationAssumptionConfigInput,
  OperatingPolicyConfigInput,
} from '../../schemas/config-assumptions';
import {
  seedInflationAssumptionHistory,
  seedInflationAssumptions,
  seedOperatingPolicy,
  seedOperatingPolicyHistory,
} from '../generators/assumptionsConfig';
import type { VersionStore } from './configStore';

export const OPERATING_POLICY_ID = 'operating-policy';

let inflation: VersionStore<InflationAssumptionConfigInput> | null = null;
let operating: VersionStore<OperatingPolicyConfigInput> | null = null;

export function getInflationAssumptionVersions(): VersionStore<InflationAssumptionConfigInput> {
  inflation ??= new Map(
    seedInflationAssumptions().map((config) => [
      config.country,
      [...seedInflationAssumptionHistory(config)],
    ]),
  );
  return inflation;
}

// A single entry under OPERATING_POLICY_ID.
export function getOperatingPolicyVersions(): VersionStore<OperatingPolicyConfigInput> {
  const seed = seedOperatingPolicy();
  operating ??= new Map([[OPERATING_POLICY_ID, [...seedOperatingPolicyHistory(seed)]]]);
  return operating;
}

export function currentOperatingPolicy(): OperatingPolicyConfigInput {
  return (
    getOperatingPolicyVersions().get(OPERATING_POLICY_ID)?.[0]?.snapshot ?? seedOperatingPolicy()
  );
}
