// Market session state calculation (UI spec 5, tokens --market-*).

import type { IsoUtcTimestamp } from '../types/dateTime';
import type { MarketId } from '../types/identifiers';
import type { MarketSchedule, TradingSession } from './marketSchedules';
import { getMarketSchedule, SUPPORTED_MARKET_SCHEDULES } from './marketSchedules';

export type MarketSessionState = 'open' | 'pre-open' | 'post-close' | 'closed' | 'holiday';

export interface MarketStatusInfo {
  readonly marketId: MarketId;
  readonly name: string;
  readonly exchangeName: string;
  readonly state: MarketSessionState;
  readonly localTimeFormatted: string;
}

function timeInMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function isWithinSession(currentMinutes: number, session: TradingSession): boolean {
  const start = timeInMinutes(session.start.hour, session.start.minute);
  const end = timeInMinutes(session.end.hour, session.end.minute);
  return currentMinutes >= start && currentMinutes < end;
}

interface LocalTimeParts {
  readonly dayOfWeek: number; // 0 = Sun, 6 = Sat
  readonly minutes: number;
}

function getLocalTimeParts(date: Date, timezone: string): LocalTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let weekdayStr = 'Sun';
  let hour = 0;
  let minute = 0;

  for (const part of parts) {
    if (part.type === 'weekday') {
      weekdayStr = part.value;
    } else if (part.type === 'hour') {
      hour = Number(part.value);
    } else if (part.type === 'minute') {
      minute = Number(part.value);
    }
  }

  const daysMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = daysMap[weekdayStr] ?? 0;
  return {
    dayOfWeek,
    minutes: timeInMinutes(hour, minute),
  };
}

export function computeMarketSessionState(
  schedule: MarketSchedule,
  timestamp: IsoUtcTimestamp,
): MarketSessionState {
  const date = new Date(timestamp);
  const { dayOfWeek, minutes } = getLocalTimeParts(date, schedule.timezone);

  // Weekend: Saturday (6) or Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'closed';
  }

  // Check regular trading hours
  const isRegularOpen = schedule.regularHours.some((session) => isWithinSession(minutes, session));
  if (isRegularOpen) {
    return 'open';
  }

  // Check pre-market hours
  if (schedule.preMarket && isWithinSession(minutes, schedule.preMarket)) {
    return 'pre-open';
  }

  // Check post-market hours
  if (schedule.postMarket && isWithinSession(minutes, schedule.postMarket)) {
    return 'post-close';
  }

  return 'closed';
}

export function getMarketSessionState(
  marketId: MarketId,
  timestamp: IsoUtcTimestamp,
): MarketSessionState {
  const schedule = getMarketSchedule(marketId);
  return computeMarketSessionState(schedule, timestamp);
}

export function isMarketOpen(marketId: MarketId, timestamp: IsoUtcTimestamp): boolean {
  return getMarketSessionState(marketId, timestamp) === 'open';
}

export function getAllMarketStatuses(timestamp: IsoUtcTimestamp): readonly MarketStatusInfo[] {
  const date = new Date(timestamp);
  return SUPPORTED_MARKET_SCHEDULES.map((schedule) => {
    const state = computeMarketSessionState(schedule, timestamp);
    const localTimeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: schedule.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    return {
      marketId: schedule.marketId,
      name: schedule.name,
      exchangeName: schedule.exchangeName,
      state,
      localTimeFormatted: localTimeFormatter.format(date),
    };
  });
}
