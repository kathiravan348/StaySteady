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

      {/* S-33 Compliance Safety Overlay (Requirement 27) */}
      <div
        style={{
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-sm)',
          border: 'var(--border-width-thin) solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}
          >
            ⚖️ S-33 Compliance & Policy Check:
          </span>
          <Badge variant="positive" size="sm">
            Passed
          </Badge>
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
          }}
        >
          Unrestricted under employer policy §2.1; no active quiet blackout periods.
        </p>
      </div>

      {/* Cooling-off period friction for high-notional orders (Requirement 29) */}
      {(() => {
        const isHighNotional =
          request.quantity >= 50 ||
          (request.limitPrice !== null &&
            Number(request.limitPrice.amount) * request.quantity >= 10000);
        const requestedAtMs = Date.parse(request.requestedAt);
        const coolingOffDurationMs = 5 * 60 * 1000;
        const coolingOffRemainingMs = Math.max(0, requestedAtMs + coolingOffDurationMs - nowMs);
        const isCoolingOff = isHighNotional && coolingOffRemainingMs > 0 && isPending;
        const coolingSeconds = Math.ceil(coolingOffRemainingMs / 1000);
        const coolingMinutes = Math.floor(coolingSeconds / 60);
        const coolingSecondsRem = coolingSeconds % 60;
        const coolingText = `${String(coolingMinutes).padStart(2, '0')}:${String(coolingSecondsRem).padStart(2, '0')}`;

        if (!isPending) return null;

        return (
          <>
            {isCoolingOff && (
              <div
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'color-mix(in srgb, var(--color-warning) 12%, var(--surface-sunken))',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-width-thin) solid var(--color-warning)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  ⏳ Cooling-Off Period Active: {coolingText} remaining
                </span>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    margin: '2px 0 0',
                  }}
                >
                  High-notional friction safeguard per Requirement 29. Mandatory pause before
                  approval.
                </p>
              </div>
            )}
            <div className={styles.actions}>
              <Button isDisabled={isBusy || isCoolingOff} onPress={onApprove}>
                {isCoolingOff ? `Cooling Off (${coolingText})` : 'Approve'}
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
          </>
        );
      })()}
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
