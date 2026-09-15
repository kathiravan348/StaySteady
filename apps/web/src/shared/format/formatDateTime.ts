// Date and time formatting with timezone awareness and relative time (UI spec 4).

import type { IanaTimeZone, IsoDate, IsoUtcTimestamp } from '../types/dateTime';

export interface FormatDateTimeOptions {
  readonly timezone?: IanaTimeZone;
  readonly includeSeconds?: boolean;
  readonly includeDate?: boolean;
  readonly showTimezoneLabel?: boolean;
}

export function formatRelativeTime(
  utcTimestamp: IsoUtcTimestamp,
  relativeTo: Date = new Date(),
): string {
  const timestampMs = new Date(utcTimestamp).getTime();
  const nowMs = relativeTo.getTime();
  const diffSeconds = Math.round((nowMs - timestampMs) / 1000);

  if (diffSeconds < 0) {
    return 'in the future';
  }
  if (diffSeconds < 45) {
    return 'just now';
  }
  if (diffSeconds < 90) {
    return '1m ago';
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatIsoDate(utcTimestamp);
}

export function formatDateTime(
  utcTimestamp: IsoUtcTimestamp,
  options: FormatDateTimeOptions = {},
): string {
  const {
    timezone = 'UTC',
    includeSeconds = true,
    includeDate = true,
    showTimezoneLabel = true,
  } = options;

  const date = new Date(utcTimestamp);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: includeDate ? 'numeric' : undefined,
    month: includeDate ? 'short' : undefined,
    day: includeDate ? '2-digit' : undefined,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
    timeZoneName: showTimezoneLabel ? 'short' : undefined,
  });

  return formatter.format(date);
}

export function formatIsoDate(isoDateOrTimestamp: IsoDate | IsoUtcTimestamp): string {
  const date = new Date(isoDateOrTimestamp);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
  return formatter.format(date);
}
