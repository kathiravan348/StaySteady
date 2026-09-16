// Alerts Centre seeds and escalation (UI spec 7.19). Each alert describes something another screen
// already shows, so following its link lands on the same fact. Escalation reads the saved alert rules.

import type { z } from 'zod';

import type { AlertGroupSchema, AlertRuleConfigInput } from '../../schemas';
import { ALERT_CHANNELS } from './healthHistoryData';

export type AlertGroupInput = z.input<typeof AlertGroupSchema>;
type Seed = Omit<AlertGroupInput, 'escalation' | 'occurrences' | 'notes'> & {
  // Minutes before now for each occurrence, newest first.
  readonly minutesAgo: readonly number[];
  readonly notes?: AlertGroupInput['notes'];
};

const SEEDS: readonly Seed[] = [
  {
    id: 'alert-unconfirmed-order',
    severity: 'critical',
    category: 'critical',
    source: 'Order execution layer',
    marketId: 'US',
    title: 'Order not confirmed by the broker: NVDA',
    message:
      'The broker has not acknowledged the order. It may or may not be live; check with the broker before doing anything else with NVDA.',
    minutesAgo: [3],
    state: 'open',
    link: { label: 'Open orders', to: '/trading/orders' },
  },
  {
    id: 'alert-approval-expiring',
    severity: 'high',
    category: 'action_needed',
    source: 'Approval queue',
    marketId: 'US',
    title: 'Approval expiring: TSLA exit',
    message: 'The RSI reversion exit signal waits for a decision and expires at the US close.',
    minutesAgo: [25],
    state: 'open',
    link: { label: 'Open the approval queue', to: '/trading/approvals' },
  },
  {
    id: 'alert-report-delivery',
    severity: 'medium',
    category: 'action_needed',
    source: 'Scheduled reports',
    marketId: null,
    title: 'Weekly costs report could not be delivered',
    message:
      'The webhook returned 502 Bad Gateway. The schedule was paused after repeated failures.',
    minutesAgo: [2 * 1440 + 90, 9 * 1440 + 90],
    state: 'open',
    link: { label: 'Open reports', to: '/reports/costs' },
  },
  {
    id: 'alert-lse-delay',
    severity: 'medium',
    category: 'action_needed',
    source: 'Backup market data provider',
    marketId: 'UK',
    title: 'Delayed prices on the London market',
    message:
      'Ticks arrived up to 45 seconds late; the feed switched to the backup provider and caught up.',
    minutesAgo: [1440 + 12, 1440 + 47, 2 * 1440 + 5, 4 * 1440 + 31],
    state: 'acknowledged',
    notes: [
      {
        at: new Date(Date.now() - (1440 - 30) * 60_000).toISOString(),
        action: 'acknowledged',
        note: 'Known issue with the primary feed at the open.',
      },
    ],
    link: { label: 'Open System Health', to: '/health/status' },
  },
  {
    id: 'alert-aapl-news',
    severity: 'medium',
    category: 'informational',
    source: 'News',
    marketId: 'US',
    title: 'High-importance news on a holding: AAPL',
    message:
      'EU regulators opened a review of Apple App Store fee changes, reported by three sources.',
    minutesAgo: [1440 + 95],
    state: 'open',
    link: { label: 'Open the news feed', to: '/news/feed' },
  },
  {
    id: 'alert-allocation-drift',
    severity: 'low',
    category: 'informational',
    source: 'Planning',
    marketId: null,
    title: 'Allocation outside tolerance: commodities',
    message: 'Commodities are above their target share by more than the tolerance.',
    minutesAgo: [6 * 60],
    state: 'open',
    link: { label: 'Open allocation targets', to: '/planning/allocation' },
  },
  {
    id: 'alert-broker-maintenance',
    severity: 'low',
    category: 'scheduled',
    source: 'Interactive Brokers',
    marketId: null,
    title: 'Scheduled broker maintenance on Sunday',
    message:
      'The broker gateway is unavailable Sunday 02:00 to 04:00 UTC. No orders will be sent then.',
    minutesAgo: [3 * 1440],
    state: 'resolved',
    notes: [
      {
        at: new Date(Date.now() - (3 * 1440 - 20) * 60_000).toISOString(),
        action: 'resolved',
        note: 'Nothing scheduled in that window.',
      },
    ],
    link: null,
  },
];

const SCENARIO_SEEDS: Readonly<Record<string, Seed>> = {
  'provider-down': {
    id: 'alert-provider-down',
    severity: 'critical',
    category: 'critical',
    source: 'Primary market data provider',
    marketId: 'US',
    title: 'Primary market data provider unreachable',
    message: 'Connection refused; traffic failed over to the backup provider.',
    minutesAgo: [8, 9, 11],
    state: 'open',
    link: { label: 'Open System Health', to: '/health/status' },
  },
  'broker-disconnected': {
    id: 'alert-broker-disconnected',
    severity: 'critical',
    category: 'critical',
    source: 'Interactive Brokers connection',
    marketId: null,
    title: 'Broker session expired',
    message: 'New orders to this broker are paused until it reconnects.',
    minutesAgo: [14],
    state: 'open',
    link: { label: 'Open broker settings', to: '/settings/brokers' },
  },
  'safety-breach': {
    id: 'alert-safety-breach',
    severity: 'critical',
    category: 'critical',
    source: 'Risk & Safety',
    marketId: null,
    title: 'Loss limit breached: automation halted',
    message: 'Open orders were cancelled after the daily loss limit was breached.',
    minutesAgo: [2],
    state: 'open',
    link: { label: 'Open Risk & Safety', to: '/risk/limits' },
  },
};

export function seedAlertGroups(scenario: string, nowMs: number): AlertGroupInput[] {
  const extra = SCENARIO_SEEDS[scenario];
  return [...(extra === undefined ? [] : [extra]), ...SEEDS].map(
    ({ minutesAgo, notes, ...seed }) => ({
      ...seed,
      occurrences: minutesAgo.map((minutes) => new Date(nowMs - minutes * 60_000).toISOString()),
      notes: notes ?? [],
      escalation: null,
    }),
  );
}

const RANK: Readonly<Record<AlertGroupInput['severity'], number>> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};
const channelName = (id: string): string =>
  ALERT_CHANNELS.find((channel) => channel.id === id)?.name ?? id;

// Escalation for an open critical alert: the first enabled rule for its category that its severity
// meets. Acknowledging or resolving stops it, so those states carry none.
export function withEscalation(
  alert: AlertGroupInput,
  rules: readonly AlertRuleConfigInput[],
  nowMs: number,
): AlertGroupInput {
  if (alert.state !== 'open' || alert.severity !== 'critical')
    return { ...alert, escalation: null };
  const rule = rules.find(
    (item) =>
      item.enabled &&
      item.category === alert.category &&
      RANK[alert.severity] >= RANK[item.minimumSeverity],
  );
  if (rule === undefined || !rule.escalation.enabled) return { ...alert, escalation: null };
  const first = alert.occurrences[alert.occurrences.length - 1] ?? new Date(nowMs).toISOString();
  const escalatesAtMs = new Date(first).getTime() + rule.escalation.afterMinutes * 60_000;
  const hasEscalated = escalatesAtMs <= nowMs;
  return {
    ...alert,
    escalation: {
      ruleName: rule.name,
      sentTo: rule.channels.map(channelName),
      escalatesTo: rule.escalation.channels.map(channelName),
      escalatesAt: new Date(escalatesAtMs).toISOString(),
      hasEscalated,
      failedChannels: hasEscalated
        ? rule.escalation.channels
            .filter(
              (id) =>
                ALERT_CHANNELS.find((channel) => channel.id === id)?.lastTest?.result === 'failed',
            )
            .map(channelName)
        : [],
    },
  };
}
