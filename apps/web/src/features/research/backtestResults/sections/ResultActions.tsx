import { Badge, Button } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { BacktestResultDto, StrategyDto } from '../../../../data/schemas';
import { ROUTES } from '../../../../routes/routes';
import { formatDateTime, humanizeToken } from '../../../../shared/format';
import { toIsoUtcTimestamp } from '../../../../shared/types/dateTime';
import type { ResultEditActions, ResultEdits } from '../useResultEdits';
import styles from '../BacktestResults.module.scss';

export interface ResultActionsProps {
  readonly result: BacktestResultDto;
  readonly strategy: StrategyDto | undefined;
  readonly edits: ResultEdits;
  readonly actions: ResultEditActions;
}

const NEXT_STAGE: Readonly<Record<string, string>> = {
  draft: 'backtested',
  backtested: 'observation',
  observation: 'semi_automatic',
  semi_automatic: 'fully_automatic',
};

// UI spec 7.10 actions: save, name, tag, compare and promote. Promotion stays deliberately
// multi-step (UI spec 7.7), and in the mock phase nothing leaves this browser session.
export function ResultActions({
  result,
  strategy,
  edits,
  actions,
}: ResultActionsProps): ReactElement {
  const [tagDraft, setTagDraft] = useState('');
  const nextStage = strategy === undefined ? undefined : NEXT_STAGE[strategy.stage];

  return (
    <div className={styles.actions}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Name this run</span>
        <input
          type="text"
          className={styles.input}
          value={edits.name}
          maxLength={80}
          placeholder={`${strategy?.name ?? 'Backtest'} ${result.startDate} to ${result.endDate}`}
          onChange={(event) => {
            actions.setName(event.target.value);
          }}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Add a tag</span>
        <span className={styles.inline}>
          <input
            type="text"
            className={styles.input}
            value={tagDraft}
            maxLength={24}
            placeholder="e.g. keep-for-review"
            onChange={(event) => {
              setTagDraft(event.target.value);
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            isDisabled={tagDraft.trim() === ''}
            onPress={() => {
              actions.addTag(tagDraft.trim());
              setTagDraft('');
            }}
          >
            Add tag
          </Button>
        </span>
      </label>

      <div className={styles.inline}>
        {edits.tags.map((tag) => (
          <Badge key={tag} variant="neutral">
            {tag}{' '}
            <button
              type="button"
              className={styles.tagRemove}
              aria-label={`Remove tag ${tag}`}
              onClick={() => {
                actions.removeTag(tag);
              }}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>

      <div className={styles.inline}>
        <Button variant="secondary" isDisabled={edits.isSaved} onPress={actions.save}>
          {edits.isSaved ? 'Saved in this session' : 'Save run'}
        </Button>
        <Link
          to={`${ROUTES.RESEARCH_BACKTEST_COMPARE}?runs=${encodeURIComponent(String(result.id))}`}
          className={styles.link}
        >
          Compare with another run
        </Link>
        {nextStage !== undefined &&
          (edits.promotionRequestedAt === null ? (
            <Button variant="secondary" onPress={actions.requestPromotion}>
              Request promotion to {humanizeToken(nextStage)}
            </Button>
          ) : (
            <span className={styles.inline}>
              <Badge variant="warning">
                Promotion requested{' '}
                {formatDateTime(toIsoUtcTimestamp(edits.promotionRequestedAt), {
                  includeSeconds: false,
                })}{' '}
                · needs a second confirmation
              </Badge>
              <Button variant="ghost" onPress={actions.withdrawPromotion}>
                Withdraw
              </Button>
            </span>
          ))}
      </div>
      <p className={styles.meta}>
        Mock phase: naming, tags, saving and promotion requests stay in this browser session.
      </p>
    </div>
  );
}
