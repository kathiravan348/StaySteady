import type { BusinessDay, Time, UTCTimestamp } from 'lightweight-charts';

import type { ChartTime } from './types';

// Callers pass plain dates ("YYYY-MM-DD") or Unix seconds; lightweight-charts brands the numbers.

export function toLibraryTime(time: ChartTime): Time {
  return typeof time === 'number' ? (time as UTCTimestamp) : time;
}

export function fromLibraryTime(time: Time): ChartTime {
  if (typeof time === 'object') {
    const day: BusinessDay = time;
    return `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
  }
  return time;
}
