// Filings and corporate actions on the research feed (requirements 38). Actions already effective
// are kept apart from those announced but not yet effective, and an unconfirmed one says so.

import { Badge, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto } from '../../../../data/api/mappers';
import type { InstrumentFeedDto } from '../../../../data/schemas';
import {
  formatDateTime,
  formatIsoDate,
  formatMoney,
  humanizeToken,
} from '../../../../shared/format';
import { PriceReaction } from '../../../../shared/ui/PriceReaction';
import styles from '../CompanyResearch.module.scss';

interface PricedProps {
  readonly instrumentId: string;
  readonly symbol: string;
}

function PriceAtTime({
  instrumentId,
  symbol,
  at,
}: PricedProps & { readonly at: string }): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
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
      {isOpen && <PriceReaction instrumentId={instrumentId} symbol={symbol} publishedAt={at} />}
    </>
  );
}

export function FilingsCard({
  feed,
  instrumentId,
  symbol,
}: PricedProps & { readonly feed: InstrumentFeedDto }): ReactElement {
  return (
    <Card title="Filings and exchange announcements">
      {feed.filings.length === 0 ? (
        <p className={styles.description}>
          No filings have been collected for this instrument. A fund or a commodity files none.
        </p>
      ) : (
        <ul className={styles.list}>
          {feed.filings.map((filing) => (
            <li key={filing.id} className={styles.flag}>
              <span className={styles.inline}>
                <Badge variant="neutral">{humanizeToken(filing.kind)}</Badge>
                <span className={styles.meta}>
                  Filed with {filing.filedWith}, {formatDateTime(filing.filedAt)}
                </span>
              </span>
              <span className={styles.flagTitle}>{filing.title}</span>
              <span className={styles.evidence}>{filing.summary}</span>
              <PriceAtTime instrumentId={instrumentId} symbol={symbol} at={filing.filedAt} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ActionsCard({
  feed,
  instrumentId,
  symbol,
}: PricedProps & { readonly feed: InstrumentFeedDto }): ReactElement {
  return (
    <Card title="Corporate actions">
      <div className={styles.columns}>
        <div className={styles.stack}>
          <span className={styles.meta}>Announced, not yet effective</span>
          {feed.announcedActions.length === 0 ? (
            <p className={styles.description}>Nothing announced and pending.</p>
          ) : (
            <ul className={styles.list}>
              {feed.announcedActions.map((action) => (
                <li key={action.id} className={styles.flag}>
                  <span className={styles.inline}>
                    <Badge variant="neutral">{humanizeToken(action.type)}</Badge>
                    {action.isConfirmed ? (
                      <Badge variant="info">Declared</Badge>
                    ) : (
                      <Badge variant="warning">Unconfirmed</Badge>
                    )}
                  </span>
                  <span className={styles.evidence}>{action.description}</span>
                  <span className={styles.meta}>
                    Announced {formatIsoDate(action.announcedOn)}, expected effective{' '}
                    {formatIsoDate(action.expectedEffectiveDate)}. Not counted in income or holdings
                    until it takes effect.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.stack}>
          <span className={styles.meta}>Effective</span>
          {feed.effectiveActions.length === 0 ? (
            <p className={styles.description}>No corporate action on record.</p>
          ) : (
            <ul className={styles.list}>
              {feed.effectiveActions.map((action) => (
                <li key={action.id} className={styles.flag}>
                  <span className={styles.inline}>
                    <Badge variant="neutral">{humanizeToken(action.type)}</Badge>
                    <span className={styles.meta}>{formatIsoDate(action.effectiveDate)}</span>
                    {action.ratio !== undefined && (
                      <span className={styles.meta}>{action.ratio}</span>
                    )}
                    {action.cashAmount !== undefined && (
                      <span className={styles.meta}>
                        {formatMoney(moneyFromDto(action.cashAmount))} per share
                      </span>
                    )}
                  </span>
                  <span className={styles.evidence}>{action.description}</span>
                  <PriceAtTime
                    instrumentId={instrumentId}
                    symbol={symbol}
                    at={`${action.effectiveDate}T00:00:00Z`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
