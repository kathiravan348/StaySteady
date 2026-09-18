// Stories that reach a company through its group or its industry rather than by name (R-11; UI
// spec 20.4): one about the Tata holding company that reaches Tata Motors and TCS only through it,
// one industry-wide story for automobiles, and a direct story and a rumour on Tata Motors.

import type { z } from 'zod';

import type { NewsItemSchema } from '../../schemas';
import { toInstrumentId, toMarketId } from '../../../shared/types/identifiers';

const MINUTE_MS = 60_000;
const ago = (now: Date, minutes: number): string =>
  new Date(now.getTime() - minutes * MINUTE_MS).toISOString();

export function groupNewsItems(now: Date): z.input<typeof NewsItemSchema>[] {
  return [
    {
      id: 'news-15-tata-sons-debt',
      title: 'Tata Sons Raises Holding-Company Borrowing to Fund Group Investments',
      summary:
        'The unlisted holding company took on new debt secured partly against its listed stakes, which is how pledges on group shares rise.',
      source: 'The Economic Times',
      url: 'https://news.example.com/tata-sons-borrowing',
      language: 'en',
      publishedAt: ago(now, 3 * 1440 + 120),
      category: 'corporate_action',
      sentiment: 'bearish',
      sentimentConfidence: 0.61,
      importance: 'high',
      relatedInstruments: [],
      relatedMarkets: [toMarketId('IN')],
      relatedGroupIds: ['grp-tata'],
    },
    {
      id: 'news-16-eu-ev-tariffs',
      title: 'EU Extends Tariff Review to Imported Premium Electric Vehicles',
      summary:
        'Every carmaker exporting to Europe is covered, so a move in one of their prices on this is not a company event.',
      source: 'Financial Times',
      url: 'https://news.example.com/eu-ev-tariffs',
      language: 'en',
      publishedAt: ago(now, 5 * 1440 + 60),
      category: 'regulatory',
      sentiment: 'bearish',
      sentimentConfidence: 0.72,
      importance: 'medium',
      relatedInstruments: [],
      relatedMarkets: [toMarketId('UK'), toMarketId('US'), toMarketId('JP'), toMarketId('IN')],
      relatedIndustryIds: ['ind-automobiles'],
    },
    {
      id: 'news-17-jlr-volumes',
      title: 'Jaguar Land Rover Wholesale Volumes Rise on Range Rover Demand',
      summary: 'Quarterly wholesales rose 6% with China flat and North America ahead.',
      source: 'Mint',
      url: 'https://news.example.com/jlr-volumes',
      language: 'en',
      publishedAt: ago(now, 7 * 1440 + 200),
      category: 'earnings',
      sentiment: 'bullish',
      sentimentConfidence: 0.77,
      importance: 'medium',
      relatedInstruments: [toInstrumentId('inst-in-tatamotors')],
      relatedMarkets: [toMarketId('IN')],
    },
    {
      id: 'news-18-tatamotors-demerger-rumour',
      title: 'Report: Tata Motors Weighing Faster Split of Commercial Vehicle Arm',
      summary:
        'Unnamed people said the timetable could be brought forward. The company has not commented.',
      source: 'Market chatter (unattributed)',
      url: 'https://news.example.com/tatamotors-split-rumour',
      language: 'en',
      publishedAt: ago(now, 1440 + 45),
      category: 'unconfirmed_report',
      sentiment: 'bullish',
      sentimentConfidence: 0.41,
      importance: 'low',
      relatedInstruments: [toInstrumentId('inst-in-tatamotors')],
      relatedMarkets: [toMarketId('IN')],
    },
  ];
}
