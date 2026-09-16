// System Health detail responses (UI spec 7.15): component checks, data freshness, provider and
// broker reliability, alert channels and incident history. Times are relative to `now` so the
// screen shows live ages; random variation is seeded (never Math.random). Data: healthDetailsData.ts.

import { Decimal } from 'decimal.js';
import type { z } from 'zod';

import type {
  AlertChannelDto,
  ComponentHealthDto,
  DataFreshnessDto,
  IncidentDto,
  ReliabilityPeriodDto,
  SourceReliabilityDto,
} from '../../schemas';
import {
  AlertChannelSchema,
  ComponentHealthSchema,
  DataFreshnessSchema,
  IncidentSchema,
  SourceReliabilitySchema,
} from '../../schemas';
import {
  ALERT_CHANNELS,
  LIVE_INCIDENTS,
  PAST_INCIDENTS,
  RELIABILITY_SOURCES,
  TEST_OUTCOMES,
  TODAY_OUTAGE,
} from './healthHistoryData';
import { COMPONENTS, FAULTS, FRESHNESS, FRESHNESS_DELAYS } from './healthMonitorData';
import type { MockGeneratorContext } from './mockContext';
import { parseGenerated, parseGeneratedList } from './validated';

type ComponentInput = z.input<typeof ComponentHealthSchema>;
type IncidentInput = z.input<typeof IncidentSchema>;

const ago = (now: Date, seconds: number): string =>
  new Date(now.getTime() - seconds * 1000).toISOString();

export function generateComponentHealth(
  now: Date,
  scenario: string,
): readonly ComponentHealthDto[] {
  const faults = FAULTS[scenario] ?? {};
  return parseGeneratedList(
    ComponentHealthSchema,
    COMPONENTS.map((seed, index): ComponentInput => {
      const fault = faults[seed.id];
      const checkedAt = ago(now, 4 + (index % 6) * 3);
      return {
        ...seed,
        status: fault?.status ?? 'healthy',
        lastCheckAt: checkedAt,
        lastSuccessAt: fault?.status === 'down' ? ago(now, 18 * 60) : checkedAt,
        responseTimeMs:
          fault?.responseTimeMs === undefined ? seed.responseTimeMs : fault.responseTimeMs,
        issue: fault?.issue ?? null,
      };
    }),
    'componentHealth',
  );
}

export function generateDataFreshness(now: Date, scenario: string): readonly DataFreshnessDto[] {
  const delays = FRESHNESS_DELAYS[scenario] ?? {};
  return parseGeneratedList(
    DataFreshnessSchema,
    FRESHNESS.map(({ ageSeconds, ...item }) => ({
      ...item,
      newestDataAt: ago(now, delays[item.id] ?? ageSeconds),
    })),
    'dataFreshness',
  );
}

const HISTORY_DAYS = 90;
const PERIOD_DAYS: Readonly<Record<ReliabilityPeriodDto, number>> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

// Ninety days are generated per source and sliced, so shorter periods agree with longer ones.
export function generateSourceReliability(
  ctx: MockGeneratorContext,
  now: Date,
  period: ReliabilityPeriodDto,
  scenario: string,
): readonly SourceReliabilityDto[] {
  const outages = TODAY_OUTAGE[scenario] ?? {};
  return parseGeneratedList(
    SourceReliabilitySchema,
    RELIABILITY_SOURCES.map((source) => {
      const stream = ctx.random.fork(`reliability:${source.id}`);
      const history = Array.from({ length: HISTORY_DAYS }, (_, index) => {
        const date = new Date(now.getTime() - (HISTORY_DAYS - 1 - index) * 86_400_000);
        const dip = stream.float(0, 1) < 0.08 ? stream.float(0.2, 6) : 0;
        return {
          date: date.toISOString().slice(0, 10),
          uptimePercent: Number((100 - dip).toFixed(2)),
        };
      });
      const todayOutage = outages[source.id];
      const last = history[history.length - 1];
      if (todayOutage !== undefined && last !== undefined) last.uptimePercent = todayOutage;
      const days = history.slice(-PERIOD_DAYS[period]);
      const interrupted = days.filter((day) => day.uptimePercent < 100).length;
      const uptime = days.reduce((sum, day) => sum + day.uptimePercent, 0) / days.length;
      return {
        id: source.id,
        name: source.name,
        kind: source.kind,
        period,
        uptimePercent: Number(uptime.toFixed(2)),
        days,
        failureCount: interrupted,
        failoverCount: source.kind === 'provider' ? Math.floor(interrupted / 2) : 0,
        requestsUsed: Math.round(source.requestLimit * source.usage),
        requestLimit: source.requestLimit,
        costUsed: {
          amount: new Decimal(source.budget).times(source.spend).toFixed(2),
          currency: 'USD',
        },
        costBudget: { amount: new Decimal(source.budget).toFixed(2), currency: 'USD' },
      };
    }),
    'sourceReliability',
  );
}

export function generateAlertChannels(now: Date): readonly AlertChannelDto[] {
  return parseGeneratedList(
    AlertChannelSchema,
    ALERT_CHANNELS.map(({ lastTest, ...channel }) => ({
      ...channel,
      lastTest:
        lastTest === null
          ? null
          : { at: ago(now, lastTest.secondsAgo), result: lastTest.result, detail: lastTest.detail },
    })),
    'alertChannels',
  );
}

export function testAlertChannel(channel: AlertChannelDto, now: Date): AlertChannelDto {
  return parseGenerated(
    AlertChannelSchema,
    { ...channel, lastTest: { at: now.toISOString(), ...TEST_OUTCOMES[channel.kind] } },
    'alertChannelTest',
  );
}

export function generateIncidentHistory(now: Date, scenario: string): readonly IncidentDto[] {
  const live = LIVE_INCIDENTS[scenario];
  const incidents: IncidentInput[] = [
    ...(live === undefined
      ? []
      : [{ ...live, id: `inc-live-${scenario}`, startedAt: ago(now, 18 * 60) }]),
    ...PAST_INCIDENTS,
  ];
  return parseGeneratedList(IncidentSchema, incidents, 'incidentHistory');
}
