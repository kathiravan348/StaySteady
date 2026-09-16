// The mock "Test connection" for data providers (UI spec 7.18). Nothing outside the app is contacted:
// the outcome follows the same scenario faults as System Health, so a provider that is down there
// fails its test here.

import type { ProviderConfigInput } from '../../schemas';
import { COMPONENTS, FAULTS, FRESHNESS, FRESHNESS_DELAYS } from './healthMonitorData';
import { KNOWN_REFERENCES, describeAge } from './providerConfig';

export interface ConnectionTestSeed {
  readonly passed: boolean;
  readonly latencyMs: number | null;
  readonly checks: readonly { label: string; passed: boolean; detail: string }[];
}

const NEW_PROVIDER_LATENCY_MS = 150;

export function testProviderConnection(
  config: ProviderConfigInput,
  scenario: string,
): ConnectionTestSeed {
  const ref = config.credentialRef;
  const credential =
    ref === null || ref.trim() === ''
      ? {
          label: 'Credential',
          passed: true,
          detail: 'Not needed; this provider serves public data.',
        }
      : KNOWN_REFERENCES.has(ref)
        ? {
            label: 'Credential',
            passed: true,
            detail: 'The reference resolves in the credential store. The value is never shown.',
          }
        : {
            label: 'Credential',
            passed: false,
            detail: `Nothing is stored under ${ref}. Add the credential there first.`,
          };

  const fault = FAULTS[scenario]?.[config.providerId];
  const component = COMPONENTS.find((item) => item.id === config.providerId);
  const latency =
    fault?.responseTimeMs === null
      ? null
      : (fault?.responseTimeMs ?? component?.responseTimeMs ?? NEW_PROVIDER_LATENCY_MS);
  const skipped = (label: string, why: string): ConnectionTestSeed['checks'][number] => ({
    label,
    passed: false,
    detail: `Not attempted: ${why}.`,
  });

  const reach = !credential.passed
    ? skipped('Connection', 'no credential to connect with')
    : latency === null
      ? { label: 'Connection', passed: false, detail: fault?.issue ?? 'No response.' }
      : latency > config.healthCheck.timeoutMs
        ? {
            label: 'Connection',
            passed: false,
            detail: `Answered in ${String(latency)} ms, over the ${String(config.healthCheck.timeoutMs)} ms timeout.`,
          }
        : { label: 'Connection', passed: true, detail: `Answered in ${String(latency)} ms.` };

  const freshness = FRESHNESS.find((item) => item.id === config.providerId);
  const age = FRESHNESS_DELAYS[scenario]?.[config.providerId] ?? freshness?.ageSeconds;
  const sample = !reach.passed
    ? skipped('Sample data', 'the connection failed')
    : age === undefined
      ? {
          label: 'Sample data',
          passed: true,
          detail: `Returned a sample for ${config.coverage.markets.join(', ')}.`,
        }
      : {
          label: 'Sample data',
          passed: age <= config.freshnessSeconds,
          detail: `Newest data is ${describeAge(age)} old; expected within ${describeAge(config.freshnessSeconds)}.`,
        };

  const checks = [credential, reach, sample];
  return {
    passed: checks.every((check) => check.passed),
    latencyMs: reach.passed ? latency : null,
    checks,
  };
}
