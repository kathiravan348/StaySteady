// Independent reconciliation against depository and registrar statements (E-05; requirements 31, 32;
// UI spec 19.2; decision 45). The broker is the record of truth: a mismatch pauses automation for
// that account until the owner resolves it with a reason.

import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import {
  useReconciliation,
  useResolveReconciliation,
  useRunReconciliation,
} from '../../../data/api';
import type { ReconciliationAccountDto } from '../../../data/schemas';
import { formatRelativeTime } from '../../../shared/format';
import styles from './Reconciliation.module.scss';

function AccountCard({ account }: { readonly account: ReconciliationAccountDto }): ReactElement {
  const run = useRunReconciliation();
  const resolve = useResolveReconciliation();
  const [reason, setReason] = useState('');
  const isMismatch = account.status === 'mismatch';

  return (
    <div className={cx(styles.account, account.automationPaused ? styles.mismatch : undefined)}>
      <div className={styles.head}>
        <span className={styles.name}>{account.brokerName}</span>
        {account.status === 'matched' && <Badge variant="positive">Matches</Badge>}
        {account.status === 'never_run' && <Badge variant="neutral">Nothing held</Badge>}
        {isMismatch && (
          <Badge variant={account.automationPaused ? 'critical' : 'warning'}>
            {account.automationPaused ? 'Mismatch, automation paused' : 'Mismatch, resolved'}
          </Badge>
        )}
      </div>
      <p className={styles.meta}>
        {account.depository} · account {account.accountReference} · {account.method}
      </p>
      <p className={styles.text}>
        {account.lastRunAt === null
          ? 'Not run: no positions at this broker.'
          : `${String(account.positionsChecked)} ${account.positionsChecked === 1 ? 'position' : 'positions'} checked ${formatRelativeTime(account.lastRunAt)}.`}
      </p>
      {account.discrepancies.map((item) => (
        <p key={item.instrumentSymbol} className={styles.text}>
          {item.instrumentSymbol}: broker {String(item.brokerQuantity)}, statement{' '}
          {String(item.statementQuantity)}
        </p>
      ))}
      {account.resolution !== null && (
        <p className={styles.meta}>
          Resolved {formatRelativeTime(account.resolution.at)}: {account.resolution.reason}
        </p>
      )}
      {account.automationPaused && (
        <label className={styles.stack}>
          <span className={styles.meta}>What was found, and why automation can resume</span>
          <textarea
            className={styles.textarea}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
        </label>
      )}
      <div className={styles.actions}>
        {account.lastRunAt !== null && (
          <Button
            variant="secondary"
            size="sm"
            isDisabled={run.isPending}
            onPress={() => {
              run.mutate(account.brokerId);
            }}
          >
            Run again
          </Button>
        )}
        {account.automationPaused && (
          <Button
            variant="danger"
            size="sm"
            isDisabled={resolve.isPending || reason.trim() === ''}
            onPress={() => {
              resolve.mutate({ brokerId: account.brokerId, reason: reason.trim() });
            }}
          >
            Resolve and resume automation
          </Button>
        )}
      </div>
      {(run.isError || resolve.isError) && (
        <p className={styles.meta}>{run.error?.message ?? resolve.error?.message}</p>
      )}
    </div>
  );
}

export function DepositoryReconciliationSection(): ReactElement {
  const reconciliation = useReconciliation();

  const body = ((): ReactElement => {
    if (reconciliation.isError) {
      return (
        <ErrorState
          title="Reconciliation status unavailable"
          message={reconciliation.error.message}
          onRetry={() => {
            void reconciliation.refetch();
          }}
        />
      );
    }
    if (reconciliation.data === undefined) return <LoadingState layout="cards" count={3} />;
    if (reconciliation.data.length === 0) {
      return (
        <EmptyState
          title="No accounts to reconcile"
          description="Broker accounts appear here once they hold positions."
        />
      );
    }
    return (
      <div className={styles.grid}>
        {reconciliation.data.map((account) => (
          <AccountCard key={account.brokerId} account={account} />
        ))}
      </div>
    );
  })();

  const paused = reconciliation.data?.filter((account) => account.automationPaused) ?? [];
  return (
    <Card title="Independent reconciliation">
      <div className={styles.stack}>
        <p className={styles.meta}>
          {paused.length > 0
            ? `Automation is paused for ${paused.map((account) => account.brokerName).join(', ')}: its positions do not match the statement.`
            : 'Broker positions compared with the depository or registrar statement for each account.'}
        </p>
        {body}
      </div>
    </Card>
  );
}
