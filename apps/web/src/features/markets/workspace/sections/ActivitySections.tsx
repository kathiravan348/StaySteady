import { Badge, Card, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import { useNewsItems, useSignals, useStrategies } from '../../../../data/api';
import {
  formatMoney,
  formatNumber,
  formatRelativeTime,
  humanizeToken,
} from '../../../../shared/format';
import styles from '../WorkspacePage.module.scss';

interface InstrumentSectionProps {
  readonly instrumentId: string;
}

const NEWS_LIMIT = 4;

// UI spec 7.4 — recent news. Sentiment is a model estimate and always shows its confidence.
export function InstrumentNewsSection({ instrumentId }: InstrumentSectionProps): ReactElement {
  const news = useNewsItems();
  const stories = useMemo(() => {
    const seen = new Set<string>();
    return (news.data ?? [])
      .filter((item) => item.relatedInstruments.some((id) => id === instrumentId))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((item) => {
        const key = item.duplicateGroupId ?? item.id;
        const isNew = !seen.has(key);
        seen.add(key);
        return isNew;
      })
      .slice(0, NEWS_LIMIT);
  }, [news.data, instrumentId]);

  let body: ReactElement;
  if (news.isError) {
    body = <p className={styles.note}>News is unavailable right now.</p>;
  } else if (news.isPending) {
    body = <LoadingState layout="table" count={2} />;
  } else if (stories.length === 0) {
    body = <p className={styles.note}>No recent news for this instrument.</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {stories.map((item) => (
          <li key={item.id} className={styles.stack}>
            <span className={styles.wrapText} lang={item.language}>
              {item.title}
            </span>
            <span className={styles.meta}>
              {item.source} · {formatRelativeTime(item.publishedAt)}
            </span>
            <span className={styles.badges}>
              {item.importance === 'high' && <Badge variant="warning">High importance</Badge>}
              <Badge variant="info">
                Model sentiment: {item.sentiment}, {Math.round(item.sentimentConfidence * 100)}%
              </Badge>
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return <Card title="Recent news">{body}</Card>;
}

// UI spec 7.4 — strategy signals currently active on this instrument.
export function SignalsSection({ instrumentId }: InstrumentSectionProps): ReactElement {
  const signals = useSignals();
  const strategies = useStrategies();
  const now = Date.now();
  const active = (signals.data ?? []).filter(
    (signal) => signal.instrumentId === instrumentId && Date.parse(signal.expiresAt) > now,
  );

  let body: ReactElement;
  if (signals.isError) {
    body = <p className={styles.note}>Signals are unavailable right now.</p>;
  } else if (signals.isPending) {
    body = <LoadingState layout="table" count={2} />;
  } else if (active.length === 0) {
    body = <p className={styles.note}>No active signals on this instrument.</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {active.map((signal) => {
          const strategy = strategies.data?.find((item) => item.id === signal.strategyId);
          return (
            <li key={signal.id} className={styles.stack}>
              <span className={styles.badges}>
                <Badge
                  variant={
                    signal.direction === 'buy'
                      ? 'positive'
                      : signal.direction === 'sell'
                        ? 'negative'
                        : 'neutral'
                  }
                >
                  {humanizeToken(signal.direction)}
                </Badge>
                <span>
                  {formatNumber(signal.targetQuantity, { decimals: 0 })} units
                  {signal.targetPrice === undefined
                    ? ''
                    : ` at ${formatMoney(moneyFromDto(signal.targetPrice), { showCurrency: 'code' })}`}
                </span>
              </span>
              <span className={styles.wrapText}>{signal.rationale}</span>
              <span className={styles.meta}>
                {strategy?.name ?? signal.strategyId} · {Math.round(signal.confidence * 100)}% model
                confidence · expires {formatRelativeTime(signal.expiresAt).replace(' ago', '')}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
  return <Card title="Active signals">{body}</Card>;
}
