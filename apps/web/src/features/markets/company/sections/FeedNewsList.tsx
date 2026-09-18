// News on the research feed (requirements 38): the instrument's own stories and those reaching it
// through its group or industry, each marked by how it arrived, with sentiment always an estimate
// with its confidence, and each openable against this instrument's price at the time.

import { Badge, Card } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { FeedReach, InstrumentNewsEntryDto } from '../../../../data/schemas';
import { formatDateTime, formatRelativeTime } from '../../../../shared/format';
import {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  sentimentReading,
} from '../../../../shared/format/newsLabels';
import { ToggleGroup } from '../../../../shared/ui/ToggleGroup';
import { PriceReaction } from '../../../../shared/ui/PriceReaction';
import styles from '../CompanyResearch.module.scss';

const REACH_FILTERS = ['all', 'direct', 'indirect'] as const;
type ReachFilter = (typeof REACH_FILTERS)[number];
const REACH_FILTER_LABEL: Readonly<Record<ReachFilter, string>> = {
  all: 'All',
  direct: 'About this instrument',
  indirect: 'Through group or industry',
};

function reachText(reach: FeedReach, via: string | null): string {
  switch (reach) {
    case 'direct':
      return 'About this instrument';
    case 'group':
      return `Indirect, through ${via ?? 'the group'}`;
    case 'peer':
      return `Industry-wide, through ${via ?? 'a peer'}`;
  }
}

const REACH_VARIANT: Readonly<Record<FeedReach, BadgeVariant>> = {
  direct: 'info',
  group: 'warning',
  peer: 'neutral',
};

function NewsEntry({
  entry,
  instrumentId,
  symbol,
}: {
  readonly entry: InstrumentNewsEntryDto;
  readonly instrumentId: string;
  readonly symbol: string;
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { item } = entry;
  const isRumour = item.category === 'unconfirmed_report';
  return (
    <li className={styles.flag}>
      <div className={styles.inline}>
        <Badge variant={REACH_VARIANT[entry.reach]}>{reachText(entry.reach, entry.via)}</Badge>
        <Badge variant={isRumour ? 'warning' : 'neutral'}>{CATEGORY_LABELS[item.category]}</Badge>
        <span className={styles.meta}>{IMPORTANCE_LABELS[item.importance]}</span>
        <span className={styles.meta} title="Sentiment is a model estimate, not a reported fact">
          Estimated sentiment: {sentimentReading(item)}
        </span>
      </div>
      <span className={styles.flagTitle}>{item.title}</span>
      {isRumour && (
        <span className={styles.evidence}>
          Unconfirmed: reported without attribution and not confirmed by the company. Not counted as
          a fact anywhere on this screen.
        </span>
      )}
      <div className={styles.inline}>
        <span className={styles.meta}>{item.source}</span>
        <time
          className={styles.meta}
          dateTime={item.publishedAt}
          title={formatDateTime(item.publishedAt)}
        >
          {formatRelativeTime(item.publishedAt)}
        </time>
        <button
          type="button"
          className={styles.linkButton}
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? 'Hide the price at the time' : `Show ${symbol} price at the time`}
        </button>
      </div>
      {isOpen && (
        <div className={styles.stack}>
          <p className={styles.description}>{item.summary}</p>
          <PriceReaction
            instrumentId={instrumentId}
            symbol={symbol}
            publishedAt={item.publishedAt}
          />
        </div>
      )}
    </li>
  );
}

export function FeedNewsList({
  news,
  instrumentId,
  symbol,
}: {
  readonly news: readonly InstrumentNewsEntryDto[];
  readonly instrumentId: string;
  readonly symbol: string;
}): ReactElement {
  const [filter, setFilter] = useState<ReachFilter>('all');
  const shown = news.filter(
    (entry) =>
      filter === 'all' ||
      (filter === 'direct' ? entry.reach === 'direct' : entry.reach !== 'direct'),
  );
  const indirect = news.filter((entry) => entry.reach !== 'direct').length;

  return (
    <Card title="News">
      <div className={styles.stack}>
        <div className={styles.inline}>
          <ToggleGroup
            label="Which news"
            options={REACH_FILTERS}
            value={filter}
            onChange={setFilter}
            formatOption={(option) => REACH_FILTER_LABEL[option]}
          />
          <span className={styles.meta}>
            {String(news.length)} {news.length === 1 ? 'story' : 'stories'}, {String(indirect)}{' '}
            reaching {symbol} indirectly
          </span>
        </div>
        {shown.length === 0 ? (
          <p className={styles.description}>
            {news.length === 0
              ? `No news has reached ${symbol} directly or through its group or industry.`
              : 'No stories of this kind; choose All to see the rest.'}
          </p>
        ) : (
          <ul className={styles.list}>
            {shown.map((entry) => (
              <NewsEntry
                key={entry.item.id}
                entry={entry}
                instrumentId={instrumentId}
                symbol={symbol}
              />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
