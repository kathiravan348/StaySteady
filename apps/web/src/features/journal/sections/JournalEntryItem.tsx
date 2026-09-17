import { Badge, Button } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto, useJournalReview } from '../../../data/api';
import type { JournalEntryDto } from '../../../data/schemas';
import { JournalReviewRequestSchema } from '../../../data/schemas';
import { formatDateTime, formatMoney, formatPercentage } from '../../../shared/format';
import styles from '../Journal.module.scss';
import { KIND_LABELS } from '../model/journalFilters';

const OUTCOME: Readonly<
  Record<JournalEntryDto['outcome']['status'], { variant: BadgeVariant; label: string }>
> = {
  known: { variant: 'neutral', label: 'Outcome known' },
  pending: { variant: 'info', label: 'Outcome pending' },
  not_measured: { variant: 'neutral', label: 'Not measured' },
};

export function JournalEntryItem({ entry }: { readonly entry: JournalEntryDto }): ReactElement {
  const review = useJournalReview();
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const parsed = JournalReviewRequestSchema.safeParse({ note });
  const { outcome, context } = entry;

  return (
    <li className={styles.entry}>
      <span className={styles.inline}>
        <Badge variant="neutral">{KIND_LABELS[entry.kind]}</Badge>
        <span className={styles.title}>{entry.title}</span>
        {entry.override && <Badge variant="warning">Override</Badge>}
        {context.afterLoss && (
          <Badge variant="warning">
            After a{' '}
            {formatPercentage(context.portfolioChange7dPercent ?? 0, { decimals: 1, signed: true })}{' '}
            week
          </Badge>
        )}
        {context.againstTargets && <Badge variant="warning">Away from targets</Badge>}
      </span>
      <span className={styles.meta}>
        {formatDateTime(entry.at)}
        {entry.price === null ? '' : ` · at ${formatMoney(moneyFromDto(entry.price))}`}
        {entry.strategyName === null ? '' : ` · ${entry.strategyName}`}
      </span>
      {entry.reason === null ? (
        <p className={styles.note}>No reason was given at the time.</p>
      ) : (
        <p className={styles.reason}>“{entry.reason}”</p>
      )}
      <span className={styles.inline}>
        <Badge variant={OUTCOME[outcome.status].variant}>{OUTCOME[outcome.status].label}</Badge>
        {outcome.verdict !== null && (
          <Badge variant={outcome.verdict === 'with' ? 'positive' : 'negative'}>
            {outcome.verdict === 'with' ? 'Went the way you expected' : 'Went the other way'}
          </Badge>
        )}
        <span className={styles.note}>{outcome.summary}</span>
      </span>

      {entry.review !== null ? (
        <p className={styles.note}>
          <strong>Your review ({formatDateTime(entry.review.at)}):</strong> {entry.review.note}
        </p>
      ) : (
        <form
          className={styles.reviewForm}
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (!parsed.success) return;
            review.mutate({ id: entry.id, note: parsed.data.note });
          }}
        >
          <label className={`${styles.field} ${styles.reviewInput}`}>
            <span className={styles.fieldLabel}>Looking back</span>
            <input
              className={styles.input}
              value={note}
              aria-invalid={submitted && !parsed.success}
              onChange={(event) => {
                setNote(event.target.value);
              }}
            />
          </label>
          <Button type="submit" variant="secondary" isDisabled={review.isPending}>
            Add review
          </Button>
          {submitted && !parsed.success && (
            <p className={styles.error}>{parsed.error.issues[0]?.message}</p>
          )}
          {review.isError && <p className={styles.error}>{review.error.message}</p>}
        </form>
      )}
    </li>
  );
}
