// News feed items and economic calendar events generator (M-11).
// Fulfills UI Spec 15 multi-language, duplicate story grouping, and macro event needs.

import type { z } from 'zod';
import type { CalendarEventDto, NewsItemDto } from '../../schemas';
import { CalendarEventSchema, NewsItemSchema } from '../../schemas';
import { parseGeneratedList } from './validated';
import type { MockGeneratorContext } from './mockContext';
import { toInstrumentId, toMarketId } from '../../../shared/types/identifiers';

export function generateNewsItems(ctx: MockGeneratorContext): readonly NewsItemDto[] {
  const news: z.input<typeof NewsItemSchema>[] = [
    {
      id: 'news-01-reuters-fed',
      title: 'Federal Reserve Signals Measured Pace on Benchmark Rate Adjustments',
      summary:
        'Policymakers emphasized incoming labor data and core PCE trends before committing to cuts.',
      source: 'Reuters',
      url: 'https://news.example.com/fed-policy-update',
      language: 'en',
      publishedAt: ctx.referenceTime,
      category: 'macroeconomic',
      sentiment: 'neutral',
      sentimentConfidence: 0.88,
      importance: 'high',
      relatedInstruments: [toInstrumentId('inst-us-spy'), toInstrumentId('inst-us-treasury')],
      relatedMarkets: [toMarketId('US')],
      duplicateGroupId: 'dup-fed-rate-2026',
    },
    {
      id: 'news-02-bloomberg-fed',
      title: 'Fed Holds Steady As Inflation Metrics Align With Projections',
      summary:
        'Chair reiterates data-dependency, dampening speculation of aggressive easing cycles.',
      source: 'Bloomberg',
      url: 'https://news.example.com/bloomberg-fed-hold',
      language: 'en',
      publishedAt: ctx.referenceTime,
      category: 'macroeconomic',
      sentiment: 'neutral',
      sentimentConfidence: 0.92,
      importance: 'high',
      relatedInstruments: [toInstrumentId('inst-us-spy')],
      relatedMarkets: [toMarketId('US')],
      duplicateGroupId: 'dup-fed-rate-2026',
    },
    {
      id: 'news-03-nvda-earnings',
      title: 'NVIDIA Beats Fiscal Q4 Estimates on Strong Enterprise Data Center Demand',
      summary:
        'Next-generation accelerator shipments exceed street targets with robust gross margins.',
      source: 'Financial Times',
      url: 'https://news.example.com/nvda-q4-results',
      language: 'en',
      publishedAt: ctx.referenceTime,
      category: 'earnings',
      sentiment: 'bullish',
      sentimentConfidence: 0.96,
      importance: 'high',
      relatedInstruments: [toInstrumentId('inst-us-nvda')],
      relatedMarkets: [toMarketId('US')],
    },
    {
      id: 'news-04-toyota-nikkei',
      title: 'トヨタ自動車、次世代EVバッテリー生産計画を前倒し発表',
      summary: '2027年実用化を目指す全固体電池ラインへの設備投資を拡大すると公表した。',
      source: 'Nikkei News',
      url: 'https://news.example.com/toyota-battery-jp',
      language: 'ja',
      publishedAt: ctx.referenceTime,
      category: 'corporate_action',
      sentiment: 'bullish',
      sentimentConfidence: 0.84,
      importance: 'medium',
      relatedInstruments: [toInstrumentId('inst-jp-7203')],
      relatedMarkets: [toMarketId('JP')],
    },
    {
      id: 'news-05-reliance-board',
      title: 'Reliance Industries Appoints New Leadership to Clean Energy Division',
      summary:
        'Strategic appointment signals acceleration of green hydrogen and solar gigafactories.',
      source: 'Economic Times',
      url: 'https://news.example.com/reliance-leadership',
      language: 'en',
      publishedAt: ctx.referenceTime,
      category: 'management_change',
      sentiment: 'bullish',
      sentimentConfidence: 0.76,
      importance: 'medium',
      relatedInstruments: [toInstrumentId('inst-in-reliance')],
      relatedMarkets: [toMarketId('IN')],
    },
    {
      id: 'news-06-crypto-rumor',
      title: 'Unconfirmed Reports of New Digital Asset Custody Rules in European Union',
      summary:
        'Market sources suggest MiCA amendment drafts may refine cold-storage reserve definitions.',
      source: 'CryptoBriefing',
      url: 'https://news.example.com/mica-custody-rumor',
      language: 'en',
      publishedAt: ctx.referenceTime,
      category: 'unconfirmed_report',
      sentiment: 'bearish',
      sentimentConfidence: 0.55,
      importance: 'low',
      relatedInstruments: [toInstrumentId('inst-us-btc')],
      relatedMarkets: [toMarketId('US')],
    },
  ];

  return parseGeneratedList(NewsItemSchema, news, 'newsItems');
}

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
  ];

  return parseGeneratedList(CalendarEventSchema, events, 'calendarEvents');
}
