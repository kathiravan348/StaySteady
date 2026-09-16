import { AnalyticalChart, Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { moneyFromDto, useGoalAction } from '../../../data/api';
import type { GoalViewDto } from '../../../data/schemas';
import { formatMoney } from '../../../shared/format';
import { isMoneyPositive, subtractMoney } from '../../../shared/money';
import styles from '../Planning.module.scss';

// UI spec 7.17 — one goal: progress of its linked holdings, where it lands by the target date on its
// assumptions, and when it would be reached.
export function GoalCard({
  view,
  symbols,
  onEdit,
}: {
  readonly view: GoalViewDto;
  readonly symbols: ReadonlyMap<string, string>;
  readonly onEdit: () => void;
}): ReactElement {
  const action = useGoalAction();
  const [confirming, setConfirming] = useState(false);
  const { goal } = view;
  const target = moneyFromDto(goal.targetAmount);
  const shortfall = subtractMoney(target, moneyFromDto(view.projectedAtTarget));

  return (
    <Card
      title={goal.name}
      extra={
        <Badge variant={view.onTrack ? 'positive' : 'warning'}>
          {view.onTrack ? 'On track' : 'Behind plan'}
        </Badge>
      }
    >
      <div className={styles.stack}>
        {/* Progress towards a goal is good news, so a plain bar rather than a usage meter that warns as it fills. */}
        <div className={styles.stack}>
          <span className={styles.value}>{formatMoney(moneyFromDto(view.current))}</span>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label={`${goal.name} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={view.progressPercent}
          >
            <div className={styles.barFill} style={{ width: `${String(view.progressPercent)}%` }} />
          </div>
          <span className={styles.meta}>
            {String(view.progressPercent)}% of {formatMoney(target)} by {goal.targetDate}
          </span>
        </div>
        <span className={styles.meta}>
          Linked: {goal.linkedInstrumentIds.map((id) => symbols.get(id) ?? id).join(', ')} · adding{' '}
          {formatMoney(moneyFromDto(goal.monthlyContribution))} a month · assuming{' '}
          {String(goal.expectedReturnPercent)}% a year
        </span>
        <p className={styles.note}>
          Projected at {goal.targetDate}:{' '}
          <strong>{formatMoney(moneyFromDto(view.projectedAtTarget))}</strong>
          {isMoneyPositive(shortfall) ? `, short by ${formatMoney(shortfall)}.` : '.'}{' '}
          {view.projectedCompletion === null
            ? 'Not reached within 50 years on these assumptions.'
            : `Reached around ${view.projectedCompletion}.`}
        </p>
        <AnalyticalChart
          preset="comparison-curves"
          data={{
            dates: view.projection.map((point) => point.date),
            series: [
              { name: 'Projected value', values: view.projection.map((point) => point.value) },
            ],
            baseline: Number(goal.targetAmount.amount),
          }}
          height={200}
        />
        <p className={styles.meta}>
          The line across the chart is the target. Projections compound monthly and are not a
          forecast.
        </p>
        {action.isError && <p className={styles.warning}>{action.error.message}</p>}
        <span className={styles.inline}>
          <Button variant="secondary" onPress={onEdit}>
            Edit
          </Button>
          {confirming ? (
            <>
              <Button
                variant="danger"
                isLoading={action.isPending}
                onPress={() => {
                  action.mutate({ kind: 'delete', id: goal.id });
                }}
              >
                Delete {goal.name}
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  setConfirming(false);
                }}
              >
                Keep it
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onPress={() => {
                setConfirming(true);
              }}
            >
              Delete…
            </Button>
          )}
        </span>
      </div>
    </Card>
  );
}
