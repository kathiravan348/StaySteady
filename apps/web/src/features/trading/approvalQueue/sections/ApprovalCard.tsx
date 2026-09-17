import { Badge, Button, cx } from '@staysteady/ui';
import type { ReactElement } from 'react';

import { moneyFromDto } from '../../../../data/api';
import type { ApprovalRequestDto, RiskCheckDto } from '../../../../data/schemas';
import { formatMoney, formatRelativeTime } from '../../../../shared/format';
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

// The compliance result sits with the risk checks, since the same safety layer enforces both
// (UI spec 19.2; requirements 27).
function complianceCheck(request: ApprovalRequestDto): RiskCheckDto {
  const { compliance } = request;
  return {
    id: 'compliance',
    label: compliance.preClearanceRequired ? 'Compliance (pre-clearance required)' : 'Compliance',
    status: compliance.status === 'passed' ? 'passed' : 'failed',
    detail: `${compliance.summary} ${compliance.policyClause}`,
  };
}

// Time left until an approved trade may be placed, or null when nothing is cooling off.
function coolingOffLeft(request: ApprovalRequestDto, nowMs: number): number | null {
  const executableAt = request.coolingOff?.executableAt ?? null;
  if (request.status !== 'approved' || executableAt === null) return null;
  const left = Date.parse(executableAt) - nowMs;
  return left > 0 ? left : null;
}

function minutesSeconds(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60))}m ${String(seconds % 60).padStart(2, '0')}s`;
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
  const isRefused = request.compliance.status === 'refused';
  const hasFailedCheck = request.riskChecks.some((check) => check.status === 'failed');
  const coolingLeft = coolingOffLeft(request, nowMs);

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
          {isPending && !isRefused && (
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
          {isRefused && <Badge variant="critical">Restricted</Badge>}
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
      <RiskChecks checks={[complianceCheck(request), ...request.riskChecks]} />

      {isPending && request.coolingOff !== null && (
        <p className={styles.meta}>
          Above {formatMoney(moneyFromDto(request.coolingOff.appliesAbove))}: once approved it waits{' '}
          {String(request.coolingOff.minutes)} minutes before it may be placed, and can be withdrawn
          meanwhile.
        </p>
      )}

      {isPending && (
        <div className={styles.actions}>
          <Button isDisabled={isBusy || isRefused} onPress={onApprove}>
            Approve
          </Button>
          <Button variant="secondary" isDisabled={isBusy || isRefused} onPress={onModify}>
            Modify
          </Button>
          <Button variant="danger" isDisabled={isBusy} onPress={onReject}>
            Reject
          </Button>
          {isRefused && (
            <span className={styles.meta}>
              Compliance refuses this trade, so it cannot be approved.
            </span>
          )}
          {countdown.isExpired && (
            <span className={styles.meta}>
              This proposal has expired. Approving it now would act on stale prices.
            </span>
          )}
        </div>
      )}

      {coolingLeft !== null && (
        <div className={styles.coolingOff}>
          <span className={styles.checkLabel}>
            Approved, cooling off: may be placed in {minutesSeconds(coolingLeft)}
          </span>
          <Button variant="danger" size="sm" isDisabled={isBusy} onPress={onReject}>
            Withdraw
          </Button>
        </div>
      )}

      {!isPending && (
        <div className={styles.inline}>
          <Badge
            variant={
              request.status === 'approved'
                ? 'positive'
                : request.status === 'expired'
                  ? 'neutral'
                  : 'negative'
            }
          >
            {request.status === 'approved'
              ? 'Approved'
              : request.status === 'expired'
                ? 'Withdrawn'
                : 'Rejected'}
          </Badge>
          {request.decisionReason !== null && (
            <span className={styles.meta}>{request.decisionReason}</span>
          )}
        </div>
      )}
    </li>
  );
}
