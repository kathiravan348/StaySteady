import { Badge, Button, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { ApprovalRequestDto } from '../../../../data/schemas';
import { formatRelativeTime } from '../../../../shared/format';
import { countdownTo } from '../model/countdown';
import { ImpactPreview, RiskChecks } from './ImpactPreview';
import styles from '../ApprovalQueue.module.scss';

export interface ApprovalCardProps {
  readonly request: ApprovalRequestDto;
  readonly nowMs: number;
  readonly isSelected: boolean;
  readonly isBusy: boolean;
  readonly onSelect: (selected: boolean) => void;
  readonly onApprove: () => void;
  readonly onModify: () => void;
  readonly onReject: () => void;
}

export function ApprovalCard({
  request,
  nowMs,
  isSelected,
  isBusy,
  onSelect,
  onApprove,
  onModify,
  onReject,
}: ApprovalCardProps): ReactElement {
  const countdown = countdownTo(String(request.expiresAt), nowMs);
  const isPending = request.status === 'pending';
  const hasFailedCheck = request.riskChecks.some((check) => check.status === 'failed');

  return (
    <li
      className={cx(
        styles.card,
        request.isSimulated ? styles.cardSimulated : undefined,
        countdown.isUrgent && isPending ? styles.cardUrgent : undefined,
      )}
    >
      <div className={styles.cardHeader}>
        <span className={styles.headline}>
          {isPending && (
            <label className={styles.checkOption}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(event) => {
                  onSelect(event.target.checked);
                }}
              />
              <span className={styles.visuallyHidden}>
                Select {request.side} {request.instrumentSymbol} for bulk approval
              </span>
            </label>
          )}
          <span className={styles.symbol}>{request.instrumentSymbol}</span>
          <span className={cx(styles.side, request.side === 'buy' ? styles.buy : styles.sell)}>
            {request.side}
          </span>
          <span className={styles.meta}>
            {String(request.quantity)} units · {request.orderType.replace('_', ' ')}
            {request.limitPrice !== null && ` at ${request.limitPrice.amount}`}
          </span>
          <Badge variant={request.isSimulated ? 'neutral' : 'info'}>
            {request.isSimulated ? 'Simulated' : 'Real order'}
          </Badge>
          {hasFailedCheck && <Badge variant="critical">Failed a risk check</Badge>}
        </span>

        <span
          className={cx(
            styles.countdown,
            countdown.isUrgent || countdown.isExpired ? styles.countdownUrgent : undefined,
          )}
        >
          {isPending
            ? countdown.label
            : `Decided ${formatRelativeTime(request.decidedAt ?? request.requestedAt)}`}
        </span>
      </div>

      <p className={styles.reason}>{request.reason}</p>

      <p className={styles.meta}>
        {request.instrumentName} · {request.marketId}
        {request.strategyName !== null && ` · ${request.strategyName}`} · requested{' '}
        {formatRelativeTime(request.requestedAt)}
      </p>

      <ImpactPreview impact={request.impact} />
      <RiskChecks checks={request.riskChecks} />

      {isPending ? (
        <div className={styles.actions}>
          <Button isDisabled={isBusy} onPress={onApprove}>
            Approve
          </Button>
          <Button variant="secondary" isDisabled={isBusy} onPress={onModify}>
            Modify
          </Button>
          <Button variant="danger" isDisabled={isBusy} onPress={onReject}>
            Reject
          </Button>
          {countdown.isExpired && (
            <span className={styles.meta}>
              This proposal has expired. Approving it now would act on stale prices.
            </span>
          )}
        </div>
      ) : (
        <div className={styles.inline}>
          <Badge variant={request.status === 'approved' ? 'positive' : 'negative'}>
            {request.status === 'approved' ? 'Approved' : 'Rejected'}
          </Badge>
          {request.decisionReason !== null && (
            <span className={styles.meta}>{request.decisionReason}</span>
          )}
        </div>
      )}
    </li>
  );
}
