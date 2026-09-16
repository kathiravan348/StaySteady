import { Badge, cx } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { InstrumentDto, NewsImportanceDto } from '../../../data/schemas';
import { formatDateTime, formatRelativeTime } from '../../../shared/format';
import type { NewsStory } from '../model/newsFeed';
import { CATEGORY_LABELS, IMPORTANCE_LABELS, sentimentReading } from '../model/newsFeed';
import styles from '../News.module.scss';
import { PriceReaction } from './PriceReaction';

const IMPORTANCE_VARIANT: Readonly<Record<NewsImportanceDto, BadgeVariant>> = {
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export interface NewsStoryCardProps {
  readonly story: NewsStory;
  readonly instruments: ReadonlyMap<string, InstrumentDto>;
  readonly heldIds: ReadonlySet<string>;
}

// UI spec 7.6 — one story: facts (headline, source, time, instruments, category, importance) and the
// sentiment estimate kept visibly apart. Expanding shows the summary, every report of a duplicated
// story, and the price reaction.
export function NewsStoryCard({ story, instruments, heldIds }: NewsStoryCardProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { lead, reports } = story;
  const detailsId = `news-details-${story.key}`;
  const firstInstrument = story.instrumentIds
    .map((id) => instruments.get(id))
    .find((instrument) => instrument !== undefined);

  return (
    <li className={cx(styles.story, story.isHeld ? styles.held : undefined)}>
      <span className={styles.inline}>
        {story.isHeld && <Badge variant="info">Held</Badge>}
        <Badge variant={lead.category === 'unconfirmed_report' ? 'warning' : 'neutral'}>
          {CATEGORY_LABELS[lead.category]}
        </Badge>
        <Badge variant={IMPORTANCE_VARIANT[lead.importance]}>
          {IMPORTANCE_LABELS[lead.importance]}
        </Badge>
        <span
          className={cx(
            styles.estimate,
            lead.sentiment === 'bullish'
              ? styles.bullish
              : lead.sentiment === 'bearish'
                ? styles.bearish
                : undefined,
          )}
          title="Sentiment is a model estimate, not a reported fact"
        >
          Estimated sentiment: {sentimentReading(lead)}
        </span>
      </span>

      <h3 className={styles.headline}>
        <button
          type="button"
          className={styles.headlineButton}
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {lead.title}
        </button>
      </h3>

      <span className={styles.inline}>
        <span className={styles.meta}>
          {lead.source}
          {reports.length > 1 &&
            ` and ${String(reports.length - 1)} more ${reports.length === 2 ? 'source' : 'sources'}`}
        </span>
        <time
          className={styles.meta}
          dateTime={lead.publishedAt}
          title={formatDateTime(lead.publishedAt)}
        >
          {formatRelativeTime(lead.publishedAt)}
        </time>
        {story.instrumentIds.map((id) => (
          <span key={id} className={cx(styles.chip, heldIds.has(id) ? styles.chipHeld : undefined)}>
            {instruments.get(id)?.symbol ?? id}
            {heldIds.has(id) ? ' · held' : ''}
          </span>
        ))}
        {story.instrumentIds.length === 0 && (
          <span className={styles.meta}>{story.marketIds.join(', ')} market</span>
        )}
      </span>

      {isOpen && (
        <div id={detailsId} className={styles.details}>
          <p className={styles.note}>{lead.summary}</p>
          {reports.length > 1 && (
            <div className={styles.stack}>
              <span className={styles.fieldLabel}>Reported by {reports.length} sources</span>
              <ul className={styles.reports}>
                {reports.map((report) => (
                  <li key={report.id} className={styles.meta}>
                    {report.source} · {formatDateTime(report.publishedAt)} · {report.title} ·
                    estimated {sentimentReading(report).toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {firstInstrument === undefined ? (
            <p className={styles.meta}>
              This story names no instrument, so there is no price reaction to show.
            </p>
          ) : (
            <PriceReaction
              instrumentId={String(firstInstrument.id)}
              symbol={firstInstrument.symbol}
              publishedAt={lead.publishedAt}
            />
          )}
        </div>
      )}
    </li>
  );
}
