// Labels for news items (UI spec 7.6), shared by the news feed and the company research feed
// (decision 25). Sentiment is a model estimate, so it never prints without its confidence.

import type {
  NewsCategoryDto,
  NewsImportanceDto,
  NewsItemDto,
  NewsSentimentDto,
} from '../../data/schemas';
import { humanizeToken } from './display';

export const CATEGORY_LABELS: Readonly<Record<NewsCategoryDto, string>> = {
  earnings: 'Earnings',
  regulatory: 'Regulatory',
  management_change: 'Management change',
  macroeconomic: 'Macroeconomic',
  corporate_action: 'Corporate action',
  // An unconfirmed report is not a fact; the label says so.
  unconfirmed_report: 'Unconfirmed report',
};

export const sentimentLabel = (sentiment: NewsSentimentDto): string => humanizeToken(sentiment);

// Confidence is part of every sentiment reading (UI spec 7.6), so there is no way to print one without it.
export function sentimentReading(item: NewsItemDto): string {
  return `${sentimentLabel(item.sentiment)} · ${String(Math.round(item.sentimentConfidence * 100))}% confidence`;
}

export const IMPORTANCE_LABELS: Readonly<Record<NewsImportanceDto, string>> = {
  high: 'High importance',
  medium: 'Medium importance',
  low: 'Low importance',
};
