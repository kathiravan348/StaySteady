// Economic calendar events generator (M-11), split from newsEvents.ts in session 41.
// Events that concern one instrument name it, so the calendar can filter to held instruments.

import type { z } from 'zod';

import type { CalendarEventDto } from '../../schemas';
import { CalendarEventSchema } from '../../schemas';
import { toInstrumentId, toMarketId } from '../../../shared/types/identifiers';
import { parseGeneratedList } from './validated';

export function generateCalendarEvents(): readonly CalendarEventDto[] {
  const events: z.input<typeof CalendarEventSchema>[] = [
    {
      id: 'cal-fomc-rate-dec',
      title: 'FOMC Interest Rate Decision',
      marketId: toMarketId('US'),
      date: '2026-09-16',
      eventType: 'central_bank',
      impact: 'high',
      inTradingRestrictionWindow: true,
      description: 'Federal Open Market Committee statement and economic projections release.',
    },
    {
      id: 'cal-nvda-earnings',
      instrumentId: toInstrumentId('inst-us-nvda'),
      title: 'NVIDIA Q3 Earnings Conference Call',
      marketId: toMarketId('US'),
      date: '2026-09-24',
      eventType: 'earnings',
      impact: 'high',
      inTradingRestrictionWindow: true,
      description: 'Quarterly financial report and live investor webcast.',
    },
    {
      id: 'cal-rbi-mpc',
      title: 'RBI Monetary Policy Committee Resolution',
      marketId: toMarketId('IN'),
      date: '2026-10-06',
      eventType: 'central_bank',
      impact: 'high',
      inTradingRestrictionWindow: false,
      description: 'Reserve Bank of India policy repo rate decision.',
    },
    {
      id: 'cal-uk-cpi',
      title: 'UK Consumer Price Inflation (CPI YoY)',
      marketId: toMarketId('UK'),
      date: '2026-09-18',
      eventType: 'macro_economic',
      impact: 'medium',
      inTradingRestrictionWindow: false,
      description: 'Office for National Statistics headline inflation metrics.',
    },
    {
      id: 'cal-jp-holiday',
      title: 'Autumnal Equinox Day (TSE Closed)',
      marketId: toMarketId('JP'),
      date: '2026-09-23',
      eventType: 'holiday',
      impact: 'low',
      inTradingRestrictionWindow: false,
      description: 'Tokyo Stock Exchange national market holiday.',
    },
    {
      id: 'cal-aapl-earnings',
      title: 'Apple Q4 Earnings',
      marketId: toMarketId('US'),
      date: '2026-10-29',
      eventType: 'earnings',
      impact: 'high',
      inTradingRestrictionWindow: true,
      description: 'Fiscal fourth-quarter results and conference call.',
      instrumentId: toInstrumentId('inst-us-aapl'),
    },
    {
      id: 'cal-spy-dividend',
      title: 'SPY Ex-Dividend Date',
      marketId: toMarketId('US'),
      date: '2026-09-19',
      eventType: 'dividend',
      impact: 'low',
      inTradingRestrictionWindow: false,
      description: 'Quarterly distribution; holders of record receive it next month.',
      instrumentId: toInstrumentId('inst-us-spy'),
    },
    {
      id: 'cal-reliance-agm',
      title: 'Reliance Industries Q2 Results',
      marketId: toMarketId('IN'),
      date: '2026-10-17',
      eventType: 'earnings',
      impact: 'high',
      inTradingRestrictionWindow: true,
      description: 'Board meeting to approve second-quarter results.',
      instrumentId: toInstrumentId('inst-in-reliance'),
    },
    {
      id: 'cal-azn-dividend',
      title: 'AstraZeneca Interim Dividend Payment',
      marketId: toMarketId('UK'),
      date: '2026-09-29',
      eventType: 'dividend',
      impact: 'low',
      inTradingRestrictionWindow: false,
      instrumentId: toInstrumentId('inst-uk-azn'),
    },
    {
      id: 'cal-us-payrolls',
      title: 'US Non-Farm Payrolls',
      marketId: toMarketId('US'),
      date: '2026-10-02',
      eventType: 'macro_economic',
      impact: 'high',
      inTradingRestrictionWindow: false,
      description: 'Monthly employment report from the Bureau of Labor Statistics.',
    },
    // R-11 (UI spec 20.4): results within two weeks inside a restriction window, and an ex-date.
    {
      id: 'cal-tatamotors-results',
      title: 'Tata Motors Q2 Results Board Meeting',
      marketId: toMarketId('IN'),
      date: '2026-09-29',
      eventType: 'earnings',
      impact: 'high',
      inTradingRestrictionWindow: true,
      description: 'Board meeting to approve second-quarter results; trading window closed.',
      instrumentId: toInstrumentId('inst-in-tatamotors'),
    },
    {
      id: 'cal-tatamotors-exdiv',
      title: 'Tata Motors Interim Dividend Ex-Date',
      marketId: toMarketId('IN'),
      date: '2026-10-21',
      eventType: 'dividend',
      impact: 'low',
      inTradingRestrictionWindow: false,
      description: 'Record date the following day, if the board declares the interim dividend.',
      instrumentId: toInstrumentId('inst-in-tatamotors'),
    },
    {
      id: 'cal-boe-rate',
      title: 'Bank of England Rate Decision',
      marketId: toMarketId('UK'),
      date: '2026-09-17',
      eventType: 'central_bank',
      impact: 'medium',
      inTradingRestrictionWindow: false,
    },
  ];

  return parseGeneratedList(CalendarEventSchema, events, 'calendarEvents');
}
