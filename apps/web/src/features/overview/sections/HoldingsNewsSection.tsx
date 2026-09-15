import { Badge, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useNewsItems } from '../../../data/api';
import { ROUTES } from '../../../routes/routes';
import { formatRelativeTime } from '../../../shared/format';
import { humanizeToken, selectHoldingsNews } from '../model/overviewLists';
import styles from './sections.module.scss';

export interface HoldingsNewsSectionProps {
  readonly heldInstrumentIds: ReadonlySet<string>;
}

// UI spec 7.1 side area. Sentiment is a model estimate: it always shows its confidence and is
// labelled so it cannot be mistaken for a confirmed fact (UI spec 7.6).
export function HoldingsNewsSection({ heldInstrumentIds }: HoldingsNewsSectionProps): ReactElement {
  const news = useNewsItems();
  const items = useMemo(
    () => selectHoldingsNews(news.data ?? [], heldInstrumentIds),
    [news.data, heldInstrumentIds],
  );

  const body = news.isError ? (
    <ErrorState
      title="News unavailable"
      message={news.error.message}
      onRetry={() => {
        void news.refetch();
      }}
    />
  ) : news.isPending ? (
    <LoadingState layout="table" count={3} />
  ) : items.length === 0 ? (
    <p className={styles.note}>No recent news affects your holdings.</p>
  ) : (
    <ul className={styles.list}>
      {items.map(({ item, sourceCount }) => (
        <li key={item.id} className={styles.stackedRow}>
          <span className={styles.wrappingTitle} lang={item.language}>
            {item.title}
          </span>
          <span className={styles.meta}>
            {item.source}
            {sourceCount > 1 ? ` and ${sourceCount - 1} more` : ''} ·{' '}
            {formatRelativeTime(item.publishedAt)}
          </span>
          <span className={styles.badges}>
            <Badge variant={item.importance === 'high' ? 'warning' : 'neutral'}>
              {humanizeToken(item.importance)} importance
            </Badge>
            <Badge variant="info">
              Model sentiment: {item.sentiment}, {Math.round(item.sentimentConfidence * 100)}%
              confidence
            </Badge>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <Card
      title="Holdings news"
      extra={
        <Link to={ROUTES.NEWS_FEED} className={styles.link}>
          All news
        </Link>
      }
    >
      {body}
    </Card>
  );
}
