import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { BacktestRunDto } from '../../../../data/schemas';
import { backtestResultsPath } from '../../../../routes/routes';
import styles from '../BacktestSetup.module.scss';

export interface RunPanelProps {
  readonly run: BacktestRunDto | undefined;
  readonly isStarting: boolean;
  readonly isCancelling: boolean;
  readonly isBlocked: boolean;
  readonly error: string | null;
  readonly onStart: () => void;
  readonly onCancel: () => void;
}

const ACTIVE = new Set(['queued', 'running']);

// UI spec 7.9 — run control with progress and the ability to cancel.
export function RunPanel({
  run,
  isStarting,
  isCancelling,
  isBlocked,
  error,
  onStart,
  onCancel,
}: RunPanelProps): ReactElement {
  const isActive = run !== undefined && ACTIVE.has(run.status);

  return (
    <Card title="Run backtest">
      <div className={styles.runRow}>
        <Button isDisabled={isBlocked || isActive} isLoading={isStarting} onPress={onStart}>
          {isActive ? 'Running…' : 'Run backtest'}
        </Button>
        {isActive && (
          <Button variant="secondary" isLoading={isCancelling} onPress={onCancel}>
            Cancel run
          </Button>
        )}
        {isBlocked && <span className={styles.note}>Fix the problems above to run.</span>}
      </div>

      {run !== undefined && (
        <div className={styles.stack} aria-live="polite">
          <div className={styles.runRow}>
            <Badge
              variant={
                run.status === 'completed'
                  ? 'positive'
                  : run.status === 'cancelled' || run.status === 'failed'
                    ? 'critical'
                    : 'info'
              }
            >
              {run.stage}
            </Badge>
            <span className={styles.meta}>{run.progressPercent}% complete</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Backtest progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={run.progressPercent}
            aria-valuetext={`${run.progressPercent}% complete, ${run.stage}`}
          >
            <span className={styles.progressFill} style={{ width: `${run.progressPercent}%` }} />
          </div>
          {run.message !== null && <p className={styles.note}>{run.message}</p>}
          {run.resultId !== null && (
            <Link to={backtestResultsPath(run.resultId)} className={styles.link}>
              Open the results
            </Link>
          )}
        </div>
      )}

      {error !== null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
