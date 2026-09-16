// The mock "Test connection" for brokers (UI spec 7.18). It is read-only by construction: it checks the
// credential, the session and an account read, and there is no step that places, changes or cancels
// an order. Nothing outside the app is contacted; outcomes follow System Health's scenario faults.

import type { BrokerConfigInput } from '../../schemas';
import { KNOWN_BROKER_REFERENCES, holdingsAt } from './brokerConfig';
import { COMPONENTS, FAULTS } from './healthMonitorData';
import type { ConnectionTestSeed } from './providerConnectionTest';

const NEW_BROKER_LATENCY_MS = 180;

export function testBrokerConnection(
  config: BrokerConfigInput,
  scenario: string,
): ConnectionTestSeed {
  const ref = config.credentialRef ?? '';
  const credential = KNOWN_BROKER_REFERENCES.has(ref)
    ? {
        label: 'Credential',
        passed: true,
        detail: 'The reference resolves in the credential store. The value is never shown.',
      }
    : {
        label: 'Credential',
        passed: false,
        detail: `Nothing is stored under ${ref || 'an empty reference'}. Add the credential there first.`,
      };

  const fault = FAULTS[scenario]?.[config.brokerId];
  const component = COMPONENTS.find((item) => item.id === config.brokerId);
  const latency =
    fault?.responseTimeMs === null
      ? null
      : (fault?.responseTimeMs ?? component?.responseTimeMs ?? NEW_BROKER_LATENCY_MS);

  const session = !credential.passed
    ? { label: 'Session', passed: false, detail: 'Not attempted: no credential to log in with.' }
    : latency === null || fault?.status === 'down'
      ? { label: 'Session', passed: false, detail: fault?.issue ?? 'No response.' }
      : { label: 'Session', passed: true, detail: `Logged in; answered in ${String(latency)} ms.` };

  const holdings = holdingsAt(config.brokerId);
  const account = !session.passed
    ? { label: 'Account read', passed: false, detail: 'Not attempted: no session.' }
    : {
        label: 'Account read',
        passed: true,
        detail: `Read balances in ${config.accountCurrency} and ${String(holdings.length)} position${holdings.length === 1 ? '' : 's'}.`,
      };

  const checks = [credential, session, account];
  if (config.capabilities.paperAccount) {
    checks.push(
      session.passed
        ? {
            label: 'Paper account',
            passed: true,
            detail: 'The paper account is reachable for simulation.',
          }
        : { label: 'Paper account', passed: false, detail: 'Not attempted: no session.' },
    );
  }
  return {
    passed: checks.every((check) => check.passed),
    latencyMs: session.passed ? latency : null,
    checks,
  };
}
