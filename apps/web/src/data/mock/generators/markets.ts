// Market definitions and generator for M-07 (Multi-market configuration).
// Provides 5 canonical markets (US, IN, UK, JP, SG) matching SUPPORTED_MARKET_SCHEDULES.

import type { z } from 'zod';
import type { MarketDto } from '../../schemas';
import { MarketSchema } from '../../schemas';
import { parseGeneratedList } from './validated';

export const CANONICAL_MARKETS_RAW: readonly z.input<typeof MarketSchema>[] = [
  {
    marketId: 'US',
    name: 'United States',
    country: 'USA',
    exchangeName: 'NYSE / NASDAQ',
    currency: 'USD',
    timezone: 'America/New_York',
    preMarket: { start: { hour: 4, minute: 0 }, end: { hour: 9, minute: 30 } },
    regularHours: [{ start: { hour: 9, minute: 30 }, end: { hour: 16, minute: 0 } }],
    postMarket: { start: { hour: 16, minute: 0 }, end: { hour: 20, minute: 0 } },
    weekendDays: ['saturday', 'sunday'],
    holidays: [
      { date: '2025-01-01', name: "New Year's Day", isHalfDay: false },
      { date: '2025-01-20', name: 'Martin Luther King Jr. Day', isHalfDay: false },
      { date: '2025-02-17', name: "Washington's Birthday", isHalfDay: false },
      { date: '2025-04-18', name: 'Good Friday', isHalfDay: false },
      { date: '2025-05-26', name: 'Memorial Day', isHalfDay: false },
      { date: '2025-06-19', name: 'Juneteenth National Independence Day', isHalfDay: false },
      { date: '2025-07-04', name: 'Independence Day', isHalfDay: false },
      { date: '2025-09-01', name: 'Labor Day', isHalfDay: false },
      { date: '2025-11-27', name: 'Thanksgiving Day', isHalfDay: false },
      { date: '2025-12-25', name: 'Christmas Day', isHalfDay: false },
      { date: '2026-01-01', name: "New Year's Day", isHalfDay: false },
      { date: '2026-01-19', name: 'Martin Luther King Jr. Day', isHalfDay: false },
      { date: '2026-02-16', name: "Washington's Birthday", isHalfDay: false },
      { date: '2026-04-03', name: 'Good Friday', isHalfDay: false },
      { date: '2026-05-25', name: 'Memorial Day', isHalfDay: false },
      { date: '2026-07-03', name: 'Independence Day (Observed)', isHalfDay: false },
    ],
    settlementDays: 1,
    permittedInstrumentTypes: [
      'long_term',
      'swing',
      'intraday',
      'etf',
      'mutual_fund',
      'bond',
      'commodity',
      'derivative',
      'digital_asset',
    ],
    automationPermitted: true,
    gainLossConvention: 'green-up',
  },
  {
    marketId: 'IN',
    name: 'India',
    country: 'India',
    exchangeName: 'NSE / BSE',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    preMarket: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 15 } },
    regularHours: [{ start: { hour: 9, minute: 15 }, end: { hour: 15, minute: 30 } }],
    weekendDays: ['saturday', 'sunday'],
    holidays: [
      { date: '2025-01-26', name: 'Republic Day', isHalfDay: false },
      { date: '2025-03-14', name: 'Holi', isHalfDay: false },
      { date: '2025-08-15', name: 'Independence Day', isHalfDay: false },
      { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti', isHalfDay: false },
      { date: '2025-10-21', name: 'Diwali (Laxmi Pujan)', isHalfDay: true },
      { date: '2025-12-25', name: 'Christmas', isHalfDay: false },
      { date: '2026-01-26', name: 'Republic Day', isHalfDay: false },
      { date: '2026-03-04', name: 'Holi', isHalfDay: false },
      { date: '2026-08-15', name: 'Independence Day', isHalfDay: false },
    ],
    settlementDays: 1,
    permittedInstrumentTypes: [
      'long_term',
      'swing',
      'intraday',
      'etf',
      'mutual_fund',
      'ipo',
      'derivative',
      'bond',
    ],
    automationPermitted: true,
    gainLossConvention: 'green-up',
  },
  {
    marketId: 'UK',
    name: 'United Kingdom',
    country: 'UK',
    exchangeName: 'LSE',
    currency: 'GBP',
    timezone: 'Europe/London',
    regularHours: [{ start: { hour: 8, minute: 0 }, end: { hour: 16, minute: 30 } }],
    weekendDays: ['saturday', 'sunday'],
    holidays: [
      { date: '2025-01-01', name: "New Year's Day", isHalfDay: false },
      { date: '2025-04-18', name: 'Good Friday', isHalfDay: false },
      { date: '2025-04-21', name: 'Easter Monday', isHalfDay: false },
      { date: '2025-05-05', name: 'Early May Bank Holiday', isHalfDay: false },
      { date: '2025-12-25', name: 'Christmas Day', isHalfDay: false },
      { date: '2025-12-26', name: 'Boxing Day', isHalfDay: false },
      { date: '2026-01-01', name: "New Year's Day", isHalfDay: false },
    ],
    settlementDays: 2,
    permittedInstrumentTypes: ['long_term', 'swing', 'etf', 'bond', 'currency_pair'],
    automationPermitted: true,
    gainLossConvention: 'green-up',
  },
  {
    marketId: 'JP',
    name: 'Japan',
    country: 'Japan',
    exchangeName: 'TSE',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    regularHours: [
      { start: { hour: 9, minute: 0 }, end: { hour: 11, minute: 30 } },
      { start: { hour: 12, minute: 30 }, end: { hour: 15, minute: 30 } },
    ],
    weekendDays: ['saturday', 'sunday'],
    holidays: [
      { date: '2025-01-01', name: "New Year's Day", isHalfDay: false },
      { date: '2025-01-13', name: 'Coming of Age Day', isHalfDay: false },
      { date: '2025-02-11', name: 'National Foundation Day', isHalfDay: false },
      { date: '2025-05-05', name: "Children's Day", isHalfDay: false },
      { date: '2025-11-03', name: 'Culture Day', isHalfDay: false },
      { date: '2026-01-01', name: "New Year's Day", isHalfDay: false },
    ],
    settlementDays: 2,
    permittedInstrumentTypes: ['long_term', 'swing', 'etf', 'derivative'],
    automationPermitted: true,
    gainLossConvention: 'red-up',
  },
  {
    marketId: 'SG',
    name: 'Singapore',
    country: 'Singapore',
    exchangeName: 'SGX',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    regularHours: [
      { start: { hour: 9, minute: 0 }, end: { hour: 12, minute: 0 } },
      { start: { hour: 13, minute: 0 }, end: { hour: 17, minute: 0 } },
    ],
    weekendDays: ['saturday', 'sunday'],
    holidays: [
      { date: '2025-01-01', name: "New Year's Day", isHalfDay: false },
      { date: '2025-01-29', name: 'Chinese New Year', isHalfDay: false },
      { date: '2025-08-09', name: 'National Day', isHalfDay: false },
      { date: '2025-12-25', name: 'Christmas Day', isHalfDay: false },
      { date: '2026-01-01', name: "New Year's Day", isHalfDay: false },
    ],
    settlementDays: 2,
    permittedInstrumentTypes: ['long_term', 'etf', 'bond'],
    automationPermitted: false,
    gainLossConvention: 'green-up',
  },
];

export const CANONICAL_MARKETS: readonly MarketDto[] = parseGeneratedList(
  MarketSchema,
  CANONICAL_MARKETS_RAW,
  'markets',
);

export function getCanonicalMarkets(): readonly MarketDto[] {
  return CANONICAL_MARKETS;
}

export function getMarketById(marketId: string): MarketDto | undefined {
  return CANONICAL_MARKETS.find((m) => m.marketId === marketId);
}
