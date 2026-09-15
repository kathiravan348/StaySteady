import { Badge, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useNewsItems } from '../../../../data/api';
import { formatRelativeTime, humanizeToken } from '../../../../shared/format';
import { selectInstrumentNews } from '../model/positionLists';
import styles from '../PositionPage.module.scss';

export interface NewsPanelProps {
  readonly instrumentId: string;
  readonly symbol: string;
}

// UI spec 7.3 — related news, newest first. Sentiment is a model estimate shown with its confidence.
export function NewsPanel({ instrumentId, symbol }: NewsPanelProps): ReactElement {
  const news = useNewsItems();
  const stories = useMemo(
    () => selectInstrumentNews(news.data ?? [], instrumentId),
    [news.data, instrumentId],
  );

  if (news.isError) {
    return (
      <ErrorState
        title="News unavailable"
        message={news.error.message}
        onRetry={() => {
          void news.refetch();
        }}
      />
    );
  }
  if (news.isPending) {
    return <LoadingState layout="table" count={3} />;
  }
  if (stories.length === 0) {
    return (
      <EmptyState title="No related news" description={`No recent news mentions ${symbol}.`} />
    );
  }
  return (
    <ul className={styles.list}>
      {stories.map(({ item, sourceCount }) => (
        <li key={item.id} className={styles.stackedRow}>
          <span className={styles.wrapText} lang={item.language}>
            {item.title}
          </span>
          <span className={styles.meta}>
            {item.source}
            {sourceCount > 1 ? ` and ${sourceCount - 1} more` : ''} ·{' '}
            {formatRelativeTime(item.publishedAt)}
          </span>
          <span className={styles.wrapText}>{item.summary}</span>
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
}
