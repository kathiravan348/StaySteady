import { Badge, Button, Card, ErrorState, LoadingState } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { useAlertChannels, useTestAlertChannel } from '../../../data/api';
import { formatDateTime, formatRelativeTime } from '../../../shared/format';
import styles from '../Health.module.scss';

// UI spec 7.15 — alert channel test control with the last test result and timestamp.
export function AlertChannelsPanel(): ReactElement {
  const channels = useAlertChannels();
  const test = useTestAlertChannel();

  let body: ReactElement;
  if (channels.data === undefined) {
    body = channels.isError ? (
      <ErrorState
        title="Alert channels unavailable"
        message={channels.error.message}
        onRetry={() => {
          void channels.refetch();
        }}
      />
    ) : (
      <LoadingState layout="table" count={4} />
    );
  } else {
    body = (
      <ul className={styles.channelList}>
        {channels.data.map((channel) => {
          const isTesting = test.isPending && test.variables === channel.id;
          const last = channel.lastTest;
          return (
            <li key={channel.id} className={styles.channelRow}>
              <span className={styles.stack}>
                <strong>{channel.name}</strong>
                <span className={styles.meta}>{channel.destination}</span>
              </span>
              <span className={styles.stack} aria-live="polite">
                {last === null ? (
                  <span className={styles.meta}>Never tested</span>
                ) : (
                  <>
                    <Badge variant={last.result === 'passed' ? 'positive' : 'critical'}>
                      <span aria-hidden="true">{last.result === 'passed' ? '✓' : '✕'}</span>{' '}
                      {last.result === 'passed' ? 'Test passed' : 'Test failed'}
                    </Badge>
                    <span className={styles.meta} title={formatDateTime(last.at)}>
                      {formatRelativeTime(last.at)} · {last.detail}
                    </span>
                  </>
                )}
              </span>
              <Button
                size="sm"
                variant="secondary"
                isLoading={isTesting}
                isDisabled={test.isPending && !isTesting}
                onPress={() => {
                  test.mutate(channel.id);
                }}
                aria-label={`Send a test alert by ${channel.name}`}
              >
                {isTesting ? 'Testing…' : 'Send test'}
              </Button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card title="Alert channels">
      {test.isError && (
        <p className={styles.warningText} role="alert">
          Test could not be sent: {test.error.message}
        </p>
      )}
      {body}
    </Card>
  );
}
