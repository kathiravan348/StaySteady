// Branded timestamp and date representations (standards 6.4).
// Enforces distinction between universal UTC timestamps, local dates, and market-specific times.

import type { Brand } from './brand';
import type { MarketId } from './identifiers';

export type IsoUtcTimestamp = Brand<string, 'IsoUtcTimestamp'>;
export type IsoDate = Brand<string, 'IsoDate'>;

export const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',
  'Asia/Kolkata',
  'Europe/London',
  'Asia/Tokyo',
  'Asia/Singapore',
] as const;

export type IanaTimeZone = (typeof SUPPORTED_TIMEZONES)[number] | Brand<string, 'IanaTimeZone'>;

export interface MarketLocalTimestamp {
  readonly iso: string;
  readonly timezone: IanaTimeZone;
  readonly marketId: MarketId;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function isIsoUtcTimestamp(value: unknown): value is IsoUtcTimestamp {
  return typeof value === 'string' && ISO_UTC_REGEX.test(value);
}

export function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === 'string' && ISO_DATE_REGEX.test(value);
}

export function toIsoUtcTimestamp(value: unknown): IsoUtcTimestamp {
  if (value instanceof Date) {
    return value.toISOString() as IsoUtcTimestamp;
  }
  if (typeof value === 'string' && ISO_UTC_REGEX.test(value)) {
    return value as IsoUtcTimestamp;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString() as IsoUtcTimestamp;
    }
  }
  throw new TypeError(`Expected valid ISO UTC timestamp, received: ${String(value)}`);
}

export function toIsoDate(value: unknown): IsoDate {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    return value as IsoDate;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}` as IsoDate;
  }
  throw new TypeError(`Expected valid ISO date (YYYY-MM-DD), received: ${String(value)}`);
}

export function nowUtc(): IsoUtcTimestamp {
  return new Date().toISOString() as IsoUtcTimestamp;
}

export function toMarketLocalTimestamp(
  utcTimestamp: IsoUtcTimestamp,
  timezone: IanaTimeZone,
  marketId: MarketId,
): MarketLocalTimestamp {
  return {
    iso: utcTimestamp,
    timezone,
    marketId,
  };
}
