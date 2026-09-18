// The editor with no strategy chosen (T-02): pick one to open, or create a new one here.

import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useStrategies } from '../../../../data/api';
import { strategyEditorPath } from '../../../../routes/routes';
import { humanizeToken } from '../../../../shared/format';
import styles from '../StrategyEditor.module.scss';

export interface StrategyPickerProps {
  readonly onCreate: () => void;
}

export function StrategyPicker({ onCreate }: StrategyPickerProps): ReactElement {
  const strategies = useStrategies();

  if (strategies.isError) {
    return (
      <ErrorState
        title="Strategies unavailable"
        message={strategies.error.message}
        onRetry={() => {
          void strategies.refetch();
        }}
      />
    );
  }
  if (strategies.data === undefined) return <LoadingState layout="table" count={5} />;
  if (strategies.data.length === 0) {
    return (
      <EmptyState
        title="No strategies yet"
        description="Start from a template, which is the quickest way to a strategy that works end to end."
        action={<Button onPress={onCreate}>New strategy</Button>}
      />
    );
  }

  return (
    <Card title="Open a strategy" extra={<Button onPress={onCreate}>New strategy</Button>}>
      <ul className={styles.pickerList}>
        {strategies.data.map((strategy) => (
          <li key={String(strategy.id)} className={styles.pickerRow}>
            <Link to={strategyEditorPath(String(strategy.id))} className={styles.pickerLink}>
              {strategy.name}
            </Link>
            <Badge variant="neutral">{humanizeToken(strategy.stage)}</Badge>
            <span className={styles.meta}>
              v{strategy.version} · {strategy.timeframe}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
