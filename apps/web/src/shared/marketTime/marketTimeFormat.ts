// Market time formatting utilities (UI spec 4).

import type { IsoUtcTimestamp } from '../types/dateTime';
import type { MarketId } from '../types/identifiers';
import { getMarketSchedule } from './marketSchedules';

export function formatMarketLocalTime(
  utcTimestamp: IsoUtcTimestamp,
  marketId: MarketId,
  includeSeconds = false,
): string {
  const schedule = getMarketSchedule(marketId);
  const date = new Date(utcTimestamp);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: schedule.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
    timeZoneName: 'short',
  });

  return formatter.format(date);
}

export function formatMarketDateTime(utcTimestamp: IsoUtcTimestamp, marketId: MarketId): string {
  const schedule = getMarketSchedule(marketId);
  const date = new Date(utcTimestamp);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: schedule.timezone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });

  return formatter.format(date);
}
