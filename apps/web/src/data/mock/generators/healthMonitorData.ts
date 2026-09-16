// Static watchdog data for System Health (UI spec 7.15, UI spec 15 scenarios): monitored components,
// the faults each developer scenario injects, and freshness expectations per market and provider.

import type { z } from 'zod';

import type { ComponentHealthSchema, DataFreshnessSchema } from '../../schemas';

type ComponentInput = z.input<typeof ComponentHealthSchema>;

export type ComponentSeed = Omit<
  ComponentInput,
  'status' | 'lastCheckAt' | 'lastSuccessAt' | 'issue'
>;

const component = (
  id: string,
  name: string,
  kind: ComponentSeed['kind'],
  responseTimeMs: number,
): ComponentSeed => ({ id, name, kind, responseTimeMs });

export const COMPONENTS: readonly ComponentSeed[] = [
  component('col-us-equities', 'US equities collector', 'collector', 42),
  component('col-in-equities', 'India equities collector', 'collector', 57),
  component('prov-primary', 'Primary market data provider', 'provider', 38),
  component('prov-backup', 'Backup market data provider', 'provider', 95),
  component('prov-news', 'News wire provider', 'provider', 180),
  component('brk-ibkr', 'Interactive Brokers connection', 'broker', 64),
  component('brk-zerodha', 'Zerodha connection', 'broker', 71),
  component('cache-quotes', 'Quote cache', 'cache', 2),
  component('db-timeseries', 'Time-series database', 'database', 18),
  component('db-ledger', 'Portfolio ledger database', 'database', 11),
  component('engine-strategy', 'Strategy engine', 'strategy-engine', 25),
  component('exec-orders', 'Order execution layer', 'execution', 33),
  component('jobs-scheduler', 'Scheduled jobs', 'scheduler', 9),
  component('notify-channels', 'Notification channels', 'notification', 140),
  component('watchdog', 'Watchdog', 'watchdog', 4),
];

export interface ComponentFault {
  readonly status: 'degraded' | 'down';
  readonly issue: string;
  // null means no response at all; omitted keeps the component's normal response time.
  readonly responseTimeMs?: number | null;
}

const down = (issue: string): ComponentFault => ({ status: 'down', issue, responseTimeMs: null });
const degraded = (issue: string, responseTimeMs?: number): ComponentFault =>
  responseTimeMs === undefined
    ? { status: 'degraded', issue }
    : { status: 'degraded', issue, responseTimeMs };

export const FAULTS: Readonly<Record<string, Readonly<Record<string, ComponentFault>>>> = {
  'provider-down': {
    'prov-primary': down('Connection refused; traffic failed over to the backup provider'),
    'prov-backup': degraded('Carrying all market data traffic', 840),
    'col-us-equities': degraded('Receiving ticks from the backup provider only', 310),
  },
  'broker-disconnected': {
    'brk-ibkr': down('Session expired; new orders to this broker are paused'),
    'exec-orders': degraded('3 orders queued until the broker reconnects'),
  },
  'stale-data': {
    'col-us-equities': degraded('Newest US tick is 20 minutes old'),
    'col-in-equities': degraded('Newest India tick is 20 minutes old'),
    'cache-quotes': degraded('Serving quotes older than the freshness limit'),
  },
  'safety-breach': {
    'engine-strategy': degraded('Automation halted by the risk gate'),
    'exec-orders': degraded('Open orders cancelled after a loss limit breach'),
  },
  // The application API is failing; the watchdog still reports what it can see.
  'loading-error': {
    'db-ledger': down('Queries failing with server errors'),
    'cache-quotes': down('Cache unreachable from the application API'),
    'engine-strategy': degraded('Cannot load portfolio state; signals paused'),
  },
};

export type FreshnessSeed = Omit<z.input<typeof DataFreshnessSchema>, 'newestDataAt'> & {
  readonly ageSeconds: number;
};

const market = (id: string, name: string, marketId: string, ageSeconds: number): FreshnessSeed => ({
  id,
  scope: 'market',
  name,
  marketId,
  expectedMaxAgeSeconds: 60,
  ageSeconds,
});

const provider = (
  id: string,
  name: string,
  expectedMaxAgeSeconds: number,
  ageSeconds: number,
): FreshnessSeed => ({
  id,
  scope: 'provider',
  name,
  marketId: null,
  expectedMaxAgeSeconds,
  ageSeconds,
});

export const FRESHNESS: readonly FreshnessSeed[] = [
  market('mkt-us', 'United States', 'US', 8),
  market('mkt-in', 'India', 'IN', 12),
  market('mkt-uk', 'United Kingdom', 'UK', 9),
  market('mkt-jp', 'Japan', 'JP', 15),
  market('mkt-sg', 'Singapore', 'SG', 11),
  provider('prov-primary', 'Primary market data provider', 30, 4),
  provider('prov-backup', 'Backup market data provider', 60, 21),
  provider('prov-fx', 'FX rates provider', 120, 35),
  provider('prov-news', 'News wire provider', 900, 240),
];

// Scenario-specific ages (seconds) that replace the normal ones.
export const FRESHNESS_DELAYS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'stale-data': { 'mkt-us': 1200, 'mkt-in': 1200 },
  'provider-down': { 'prov-primary': 1080, 'mkt-us': 95 },
};
