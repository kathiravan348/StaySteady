import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ConnectionTestResultDto } from '../../data/schemas';
import { formatDateTime } from '../format';
import styles from './Config.module.scss';

export interface ConnectionTestProps {
  readonly result: ConnectionTestResultDto | undefined;
  readonly isTesting: boolean;
  readonly error: string | null;
  // Why the test cannot run yet, such as fields that still need fixing; null when it can.
  readonly blockedReason: string | null;
  // The form changed after the result was taken, so the result may no longer apply.
  readonly isOutdated: boolean;
  readonly onTest: () => void;
}

// UI spec 7.18 — test connection where applicable. It tests the form as it stands, so a new or edited
// entry can be checked before it is saved. Each check is marked in words and symbols, not colour only.
export function ConnectionTest({
  result,
  isTesting,
  error,
  blockedReason,
  isOutdated,
  onTest,
}: ConnectionTestProps): ReactElement {
  return (
    <Card
      title="Test connection"
      extra={
        result === undefined ? undefined : (
          <Badge variant={result.passed ? 'positive' : 'critical'}>
            {result.passed ? 'Passed' : 'Failed'}
          </Badge>
        )
      }
    >
      <div className={styles.stack}>
        <span className={styles.inline}>
          <Button
            variant="secondary"
            isDisabled={blockedReason !== null}
            isLoading={isTesting}
            onPress={onTest}
          >
            {result === undefined ? 'Test connection' : 'Test again'}
          </Button>
          <span className={styles.meta}>
            {blockedReason ?? 'Tests the settings in this form, saved or not.'}
          </span>
        </span>

        {error !== null && <p className={styles.warning}>{error}</p>}

        {result !== undefined && (
          <>
            <span className={styles.inline}>
              <span className={styles.meta}>Tested {formatDateTime(result.testedAt)}</span>
              {result.latencyMs !== null && (
                <span className={styles.meta}>{result.latencyMs} ms</span>
              )}
            </span>
            {isOutdated && (
              <p className={styles.meta}>
                The form has changed since this test. Test again to check the new settings.
              </p>
            )}
            <ul className={styles.list} aria-label="Connection checks">
              {result.checks.map((check) => (
                <li key={check.label} className={styles.check}>
                  <span className={check.passed ? styles.passed : styles.failed} aria-hidden="true">
                    {check.passed ? '✓' : '✕'}
                  </span>
                  <span className={styles.stack}>
                    <strong className={styles.note}>
                      {check.label}: {check.passed ? 'passed' : 'failed'}
                    </strong>
                    <span className={styles.meta}>{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
