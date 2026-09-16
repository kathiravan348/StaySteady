// Alert rule seeds, health and the mock test alert (UI spec 7.18). Channels are System Health's, and a
// test alert has the same outcome as that screen's channel test, so the broken webhook fails on both.

import type { AlertRuleConfigInput, ConfigHealthDto } from '../../schemas';
import { ALERT_CHANNELS, TEST_OUTCOMES } from './healthHistoryData';
import type { ConnectionTestSeed } from './providerConnectionTest';

const NIGHT = {
  enabled: true,
  start: { hour: 23, minute: 0 },
  end: { hour: 7, minute: 0 },
  timezone: 'Asia/Kolkata',
} as const;

const NO_ESCALATION = { enabled: false, afterMinutes: 30, channels: [] };

export function seedAlertRules(): readonly AlertRuleConfigInput[] {
  return [
    {
      ruleId: 'rule-critical',
      name: 'Critical safety alerts',
      category: 'critical',
      minimumSeverity: 'high',
      channels: ['ch-push', 'ch-sms'],
      escalation: { enabled: true, afterMinutes: 5, channels: ['ch-email', 'ch-webhook'] },
      quietHours: { ...NIGHT },
      criticalOverridesQuietHours: true,
      enabled: true,
    },
    {
      ruleId: 'rule-action',
      name: 'Needs a decision',
      category: 'action_needed',
      minimumSeverity: 'medium',
      channels: ['ch-push', 'ch-email'],
      escalation: { enabled: true, afterMinutes: 30, channels: ['ch-sms'] },
      quietHours: { ...NIGHT, start: { hour: 22, minute: 0 } },
      criticalOverridesQuietHours: true,
      enabled: true,
    },
    {
      ruleId: 'rule-info',
      name: 'For information',
      category: 'informational',
      minimumSeverity: 'low',
      channels: ['ch-email'],
      escalation: NO_ESCALATION,
      quietHours: { ...NIGHT },
      criticalOverridesQuietHours: true,
      enabled: true,
    },
    {
      ruleId: 'rule-scheduled',
      name: 'Scheduled events',
      category: 'scheduled',
      minimumSeverity: 'low',
      channels: ['ch-email'],
      escalation: NO_ESCALATION,
      quietHours: { ...NIGHT, enabled: false },
      criticalOverridesQuietHours: false,
      enabled: true,
    },
  ];
}

type History = readonly {
  version: number;
  savedAt: string;
  reason: string;
  snapshot: AlertRuleConfigInput;
}[];

export function seedAlertRuleHistory(current: AlertRuleConfigInput): History {
  const initial = {
    version: 1,
    savedAt: '2024-01-02T00:00:00.000Z',
    reason: 'Initial configuration.',
  };
  // Invented mock history so diff and revert have something to show.
  if (current.ruleId === 'rule-critical') {
    return [
      {
        version: 2,
        savedAt: '2026-09-08T12:00:00.000Z',
        reason:
          'A broker outage went unseen overnight; critical alerts now escalate after 5 minutes.',
        snapshot: current,
      },
      {
        ...initial,
        snapshot: { ...current, escalation: { ...current.escalation, afterMinutes: 30 } },
      },
    ];
  }
  return [{ ...initial, snapshot: current }];
}

const channelName = (id: string): string =>
  ALERT_CHANNELS.find((channel) => channel.id === id)?.name ?? id;

export function alertRuleConfigHealth(config: AlertRuleConfigInput): ConfigHealthDto {
  const all = [
    ...new Set([
      ...config.channels,
      ...(config.escalation.enabled ? config.escalation.channels : []),
    ]),
  ];
  const failing = all.filter(
    (id) => ALERT_CHANNELS.find((channel) => channel.id === id)?.lastTest?.result === 'failed',
  );
  const untested = all.filter(
    (id) => ALERT_CHANNELS.find((channel) => channel.id === id)?.lastTest === null,
  );
  const direct = config.channels.filter((id) => !failing.includes(id));
  const findings: ConfigHealthDto[] = [];

  if (config.enabled && direct.length === 0) {
    findings.push({
      status: 'critical',
      summary: 'Every channel this rule sends to failed its last test.',
    });
  }
  if (failing.length > 0) {
    findings.push({
      status: 'warning',
      summary: `${failing.map(channelName).join(', ')} failed ${failing.length === 1 ? 'its' : 'their'} last test.`,
    });
  }
  // Critical severity always meets a rule's minimum, so without the override it waits out quiet hours.
  if (config.enabled && config.quietHours.enabled && !config.criticalOverridesQuietHours) {
    findings.push({
      status: 'warning',
      summary: 'Critical alerts matching this rule are held until quiet hours end.',
    });
  }
  if (untested.length > 0) {
    findings.push({
      status: 'warning',
      summary: `${untested.map(channelName).join(', ')} ${untested.length === 1 ? 'has' : 'have'} never been tested.`,
    });
  }

  const worst = findings.find((item) => item.status === 'critical') ?? findings[0];
  if (worst !== undefined) {
    return findings.length > 1
      ? { status: worst.status, summary: `${worst.summary} (+${String(findings.length - 1)} more)` }
      : worst;
  }
  return {
    status: 'healthy',
    summary: `Sends to ${config.channels.map(channelName).join(', ')}${config.escalation.enabled ? `; escalates after ${String(config.escalation.afterMinutes)} min` : ''}.`,
  };
}

// Mock only: nothing is sent anywhere. One check per channel, with the escalation channels included,
// marked as a test so it neither escalates nor reaches the alert centre.
export function testAlertRule(config: AlertRuleConfigInput): ConnectionTestSeed {
  const ids = [
    ...new Set([
      ...config.channels,
      ...(config.escalation.enabled ? config.escalation.channels : []),
    ]),
  ];
  const checks = ids.map((id) => {
    const channel = ALERT_CHANNELS.find((item) => item.id === id);
    if (channel === undefined) {
      return { label: id, passed: false, detail: 'No such channel.' };
    }
    const outcome = TEST_OUTCOMES[channel.kind];
    const role = config.channels.includes(id) ? '' : ' (escalation)';
    return {
      label: `${channel.name}${role}`,
      passed: outcome.result === 'passed',
      detail: `${channel.destination}: ${outcome.detail}.`,
    };
  });
  return { passed: checks.every((check) => check.passed), latencyMs: null, checks };
}
