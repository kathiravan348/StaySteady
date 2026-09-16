// Goals (UI spec 7.17): named goals with a target amount and date, linked holdings, progress and
// projected completion on stated assumptions.

import { Button, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { useGoals, useInstruments, usePortfolioHoldings } from '../../data/api';
import { ROUTES } from '../../routes/routes';
import { PageShell } from '../../shell/PageShell';
import styles from './Planning.module.scss';
import { GoalCard } from './sections/GoalCard';
import { GoalForm } from './sections/GoalForm';

const NEW = '__new__';

function GoalsBody(): ReactElement {
  const goals = useGoals();
  const holdings = usePortfolioHoldings();
  const instruments = useInstruments();
  const [editing, setEditing] = useState<string | null>(null);

  const symbols = useMemo(
    () => new Map((instruments.data ?? []).map((item) => [String(item.id), item.symbol])),
    [instruments.data],
  );
  const failed = [goals, holdings, instruments].find((query) => query.isError);
  if (failed !== undefined) {
    return (
      <ErrorState
        title="Goals unavailable"
        message={failed.error?.message ?? 'The request failed.'}
        onRetry={() => {
          void goals.refetch();
          void holdings.refetch();
          void instruments.refetch();
        }}
      />
    );
  }
  if (goals.data === undefined || holdings.data === undefined || instruments.data === undefined) {
    return <LoadingState layout="cards" count={2} />;
  }
  const options = holdings.data.map((holding) => ({
    id: String(holding.instrumentId),
    label: symbols.get(String(holding.instrumentId)) ?? String(holding.instrumentId),
  }));
  const editingGoal = goals.data.find((item) => item.goal.id === editing)?.goal ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.meta}>
          {goals.data.length} goals · {goals.data.filter((item) => item.onTrack).length} on track
        </span>
        {editing === null && (
          <Button
            variant="secondary"
            isDisabled={options.length === 0}
            onPress={() => {
              setEditing(NEW);
            }}
          >
            Add goal
          </Button>
        )}
      </div>
      {editing !== null && (
        <GoalForm
          key={editing}
          initial={editingGoal}
          holdings={options}
          onDone={() => {
            setEditing(null);
          }}
        />
      )}
      {goals.data.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description={
            options.length === 0
              ? 'Goals track holdings; add some holdings first.'
              : 'Add a goal to see progress and when it would be reached.'
          }
        />
      ) : (
        <div className={styles.cards}>
          {goals.data.map((view) => (
            <GoalCard
              key={view.goal.id}
              view={view}
              symbols={symbols}
              onEdit={() => {
                setEditing(view.goal.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanningGoalsPage(): ReactElement {
  return (
    <PageShell
      title="Goals"
      description="What the money is for, when it is needed, and whether the linked holdings are on course. Projections rest on the assumptions shown with each goal."
      breadcrumbs={[
        { label: 'Overview', to: ROUTES.OVERVIEW },
        { label: 'Planning', to: ROUTES.PLANNING_ALLOCATION },
        { label: 'Goals' },
      ]}
    >
      <GoalsBody />
    </PageShell>
  );
}
