// Static history data for System Health (UI spec 7.15): reliability sources and their usage, alert
// channels with their last test, and the incident log, including the incident each scenario opens.

import type { z } from 'zod';

import type { AlertChannelDto, IncidentSchema } from '../../schemas';

type IncidentInput = z.input<typeof IncidentSchema>;

export interface ReliabilitySource {
  readonly id: string;
  readonly name: string;
  readonly kind: 'provider' | 'broker';
  readonly requestLimit: number;
  // Fractions of the monthly request limit and cost budget already used.
  readonly usage: number;
  readonly budget: string;
  readonly spend: number;
}

const source = (
  id: string,
  name: string,
  kind: ReliabilitySource['kind'],
  [requestLimit, usage]: readonly [number, number],
  [budget, spend]: readonly [string, number],
): ReliabilitySource => ({ id, name, kind, requestLimit, usage, budget, spend });

export const RELIABILITY_SOURCES: readonly ReliabilitySource[] = [
  source(
    'prov-primary',
    'Primary market data provider',
    'provider',
    [500_000, 0.62],
    ['400', 0.55],
  ),
  source('prov-backup', 'Backup market data provider', 'provider', [100_000, 0.18], ['120', 0.2]),
  source('prov-fx', 'FX rates provider', 'provider', [50_000, 0.41], ['60', 0.5]),
  source('prov-news', 'News wire provider', 'provider', [20_000, 0.96], ['90', 0.83]),
  source('brk-ibkr', 'Interactive Brokers connection', 'broker', [30_000, 0.35], ['50', 0.4]),
  source('brk-zerodha', 'Zerodha connection', 'broker', [20_000, 0.84], ['25', 0.3]),
];

// Today's uptime for a source that a scenario takes down.
export const TODAY_OUTAGE: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'provider-down': { 'prov-primary': 72 },
  'broker-disconnected': { 'brk-ibkr': 81 },
};

interface LastTestSeed {
  readonly secondsAgo: number;
  readonly result: 'passed' | 'failed';
  readonly detail: string;
}

export type AlertChannelSeed = Omit<AlertChannelDto, 'lastTest'> & {
  readonly lastTest: LastTestSeed | null;
};

// Destinations are masked placeholders; no real contact details or webhook secrets.
export const ALERT_CHANNELS: readonly AlertChannelSeed[] = [
  {
    id: 'ch-email',
    name: 'Email',
    kind: 'email',
    destination: 'o•••@example.com',
    lastTest: { secondsAgo: 2 * 86_400, result: 'passed', detail: 'Delivered in 2.1 s' },
  },
  { id: 'ch-sms', name: 'SMS', kind: 'sms', destination: '+•• ••••• •••21', lastTest: null },
  {
    id: 'ch-push',
    name: 'Mobile push',
    kind: 'push',
    destination: 'Owner phone',
    lastTest: { secondsAgo: 6 * 3600, result: 'passed', detail: 'Delivered in 0.8 s' },
  },
  {
    id: 'ch-webhook',
    name: 'Webhook',
    kind: 'webhook',
    destination: 'https://hooks.example.com/•••',
    lastTest: {
      secondsAgo: 30 * 60,
      result: 'failed',
      detail: 'Endpoint returned 502 Bad Gateway',
    },
  },
];

export const TEST_OUTCOMES: Readonly<
  Record<AlertChannelDto['kind'], { readonly result: 'passed' | 'failed'; readonly detail: string }>
> = {
  email: { result: 'passed', detail: 'Delivered in 1.9 s' },
  sms: { result: 'passed', detail: 'Delivered in 3.4 s' },
  push: { result: 'passed', detail: 'Delivered in 0.7 s' },
  // The mock webhook endpoint stays broken so the failed state can be seen.
  webhook: { result: 'failed', detail: 'Endpoint returned 502 Bad Gateway' },
};

const incident = (
  id: string,
  severity: IncidentInput['severity'],
  title: string,
  affectedComponents: readonly string[],
  [startedAt, resolvedAt]: readonly [string, string],
  automaticActions: readonly string[],
  resolution: string,
): IncidentInput => ({
  id,
  severity,
  title,
  affectedComponents: [...affectedComponents],
  startedAt,
  resolvedAt,
  automaticActions: [...automaticActions],
  resolution,
});

export const PAST_INCIDENTS: readonly IncidentInput[] = [
  incident(
    'inc-2026-09-10-feed',
    'high',
    'Primary market data socket dropped',
    ['prov-primary', 'col-us-equities'],
    ['2026-09-10T13:45:00Z', '2026-09-10T13:48:30Z'],
    ['Paused order dispatch', 'Switched to the backup provider', 'Verified quote timestamps'],
    'Backup provider caught up; no orders missed.',
  ),
  incident(
    'inc-2026-09-08-broker',
    'medium',
    'Broker gateway timeout on margin check',
    ['brk-ibkr', 'exec-orders'],
    ['2026-09-08T15:20:00Z', '2026-09-08T15:22:15Z'],
    ['Retried order status query', 'Alerted owner about an unconfirmed fill'],
    'Broker confirmed the order was rejected for a collateral lock.',
  ),
  incident(
    'inc-2026-08-29-db',
    'critical',
    'Ledger database failover',
    ['db-ledger', 'engine-strategy'],
    ['2026-08-29T02:10:00Z', '2026-08-29T02:41:00Z'],
    ['Halted automation', 'Promoted the standby database', 'Reconciled positions with brokers'],
    'Standby promoted; reconciliation found no differences.',
  ),
  incident(
    'inc-2026-08-17-news',
    'low',
    'News wire delayed',
    ['prov-news'],
    ['2026-08-17T07:00:00Z', '2026-08-17T08:25:00Z'],
    ['Marked news sentiment as delayed'],
    'Provider restored its feed.',
  ),
  incident(
    'inc-2026-08-03-jobs',
    'medium',
    'Nightly price history job overran',
    ['jobs-scheduler', 'db-timeseries'],
    ['2026-08-03T22:00:00Z', '2026-08-04T01:15:00Z'],
    ['Held backtests that needed the new data'],
    'Job finished after a storage upgrade.',
  ),
  incident(
    'inc-2026-07-21-push',
    'low',
    'Push notifications not delivered',
    ['notify-channels'],
    ['2026-07-21T11:30:00Z', '2026-07-21T12:05:00Z'],
    ['Sent critical alerts by email instead'],
    'Push certificate renewed.',
  ),
  incident(
    'inc-2026-07-02-india',
    'high',
    'India collector stopped during the session',
    ['col-in-equities', 'cache-quotes'],
    ['2026-07-02T05:15:00Z', '2026-07-02T05:52:00Z'],
    ['Marked India quotes stale', 'Paused India strategies'],
    'Collector restarted by the watchdog.',
  ),
];

// The incident a scenario opens; the generator dates it a few minutes before the request.
export const LIVE_INCIDENTS: Readonly<Record<string, Omit<IncidentInput, 'id' | 'startedAt'>>> = {
  'provider-down': {
    severity: 'critical',
    title: 'Primary market data provider unreachable',
    affectedComponents: ['prov-primary', 'col-us-equities'],
    automaticActions: [
      'Failed over to the backup provider',
      'Paused signals that need sub-minute data',
      'Alerted owner by push and email',
    ],
  },
  'broker-disconnected': {
    severity: 'high',
    title: 'Interactive Brokers session disconnected',
    affectedComponents: ['brk-ibkr', 'exec-orders'],
    automaticActions: ['Paused new orders to this broker', 'Queued pending orders'],
  },
  'stale-data': {
    severity: 'medium',
    title: 'US and India quotes delayed',
    affectedComponents: ['col-us-equities', 'col-in-equities', 'cache-quotes'],
    automaticActions: ['Marked affected quotes stale', 'Blocked automation on stale prices'],
  },
  'safety-breach': {
    severity: 'critical',
    title: 'Daily loss limit breached',
    affectedComponents: ['engine-strategy', 'exec-orders'],
    automaticActions: [
      'Halted automation',
      'Cancelled open orders',
      'Required owner acknowledgement',
    ],
  },
};
