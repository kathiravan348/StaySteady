// Market schedules and timezone configurations (Pillar 0 and UI spec 5).

import type { IanaTimeZone } from '../types/dateTime';
import type { MarketId } from '../types/identifiers';
import { toMarketId } from '../types/identifiers';

export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
}

export interface TradingSession {
  readonly start: TimeOfDay;
  readonly end: TimeOfDay;
}

export interface MarketSchedule {
  readonly marketId: MarketId;
  readonly name: string;
  readonly country: string;
  readonly exchangeName: string;
  readonly timezone: IanaTimeZone;
  readonly currency: string;
  readonly preMarket?: TradingSession;
  readonly regularHours: readonly TradingSession[];
  readonly postMarket?: TradingSession;
}

export const SUPPORTED_MARKET_SCHEDULES: readonly MarketSchedule[] = [
  {
    marketId: toMarketId('US'),
    name: 'United States',
    country: 'USA',
    exchangeName: 'NYSE / NASDAQ',
    timezone: 'America/New_York',
    currency: 'USD',
    preMarket: { start: { hour: 4, minute: 0 }, end: { hour: 9, minute: 30 } },
    regularHours: [{ start: { hour: 9, minute: 30 }, end: { hour: 16, minute: 0 } }],
    postMarket: { start: { hour: 16, minute: 0 }, end: { hour: 20, minute: 0 } },
  },
  {
    marketId: toMarketId('IN'),
    name: 'India',
    country: 'India',
    exchangeName: 'NSE / BSE',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    preMarket: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 15 } },
    regularHours: [{ start: { hour: 9, minute: 15 }, end: { hour: 15, minute: 30 } }],
  },
  {
    marketId: toMarketId('UK'),
    name: 'United Kingdom',
    country: 'UK',
    exchangeName: 'LSE',
    timezone: 'Europe/London',
    currency: 'GBP',
    regularHours: [{ start: { hour: 8, minute: 0 }, end: { hour: 16, minute: 30 } }],
  },
  {
    marketId: toMarketId('JP'),
    name: 'Japan',
    country: 'Japan',
    exchangeName: 'TSE',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    regularHours: [
      { start: { hour: 9, minute: 0 }, end: { hour: 11, minute: 30 } },
      { start: { hour: 12, minute: 30 }, end: { hour: 15, minute: 30 } },
    ],
  },
  {
    marketId: toMarketId('SG'),
    name: 'Singapore',
    country: 'Singapore',
    exchangeName: 'SGX',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    regularHours: [
      { start: { hour: 9, minute: 0 }, end: { hour: 12, minute: 0 } },
      { start: { hour: 13, minute: 0 }, end: { hour: 17, minute: 0 } },
    ],
  },
] as const;

export function getMarketSchedule(marketId: MarketId): MarketSchedule {
  const schedule = SUPPORTED_MARKET_SCHEDULES.find((m) => m.marketId === marketId);
  if (!schedule) {
    throw new TypeError(`Unknown market id: ${marketId}`);
  }
  return schedule;
}
