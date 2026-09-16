import { Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useChangeRiskLimit } from '../../../data/api';
import type { RiskLimitDto } from '../../../data/schemas';
import { formatLimitValue } from '../model/limitDisplay';
import styles from '../Risk.module.scss';

export interface LimitChangeDialogProps {
  readonly limit: RiskLimitDto;
  readonly onClose: () => void;
}

// UI spec 7.14 — changing a limit takes explicit confirmation and is recorded. The first step asks
// for the new value and a reason; the second shows what the change does before anything is applied.
export function LimitChangeDialog({ limit, onClose }: LimitChangeDialogProps): ReactElement {
  const change = useChangeRiskLimit();
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [value, setValue] = useState(String(limit.threshold));
  const [reason, setReason] = useState('');

  const next = Number(value);
  const isNumber = value.trim() !== '' && Number.isFinite(next);
  const inBounds = isNumber && next >= limit.minimum && next <= limit.maximum;
  const isDifferent = isNumber && next !== limit.threshold;
  const canReview = inBounds && isDifferent && reason.trim() !== '';

  const breachedAfter =
    limit.used === null
      ? false
      : limit.direction === 'maximum'
        ? limit.used > next
        : limit.used < next;
  const loosens = limit.direction === 'maximum' ? next > limit.threshold : next < limit.threshold;

  const confirm = (): void => {
    change.mutate(
      { limitId: limit.id, request: { threshold: next, reason: reason.trim() } },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Change ${limit.name.toLowerCase()} · ${limit.scopeLabel}`}
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          {step === 'edit' ? (
            <Button
              isDisabled={!canReview}
              onPress={() => {
                setStep('review');
              }}
            >
              Review change
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                isDisabled={change.isPending}
                onPress={() => {
                  setStep('edit');
                }}
              >
                Back
              </Button>
              <Button variant="danger" isLoading={change.isPending} onPress={confirm}>
                Confirm change
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className={styles.dialogBody}>
        {step === 'edit' ? (
          <>
            <p className={styles.note}>
              Currently {formatLimitValue(limit, limit.threshold)}. {limit.consequence}
            </p>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                New {limit.direction === 'minimum' ? 'floor' : 'limit'} (between{' '}
                {formatLimitValue(limit, limit.minimum)} and{' '}
                {formatLimitValue(limit, limit.maximum)})
              </span>
              <input
                type="number"
                className={styles.input}
                value={value}
                min={limit.minimum}
                max={limit.maximum}
                onChange={(event) => {
                  setValue(event.target.value);
                }}
              />
            </label>
            {isNumber && !inBounds && (
              <p className={styles.warning}>That is outside the allowed range.</p>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Reason for the change</span>
              <textarea
                className={styles.textarea}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                }}
              />
            </label>
            <p className={styles.meta}>
              The change and your reason are recorded in the change log.
            </p>
          </>
        ) : (
          <>
            <div className={styles.review}>
              <span className={styles.title}>
                {formatLimitValue(limit, limit.threshold)} → {formatLimitValue(limit, next)}
              </span>
              <span className={styles.note}>Measured now: {limit.measuredBy}</span>
              <span className={styles.note}>Reason: {reason.trim()}</span>
            </div>
            {limit.isBreached && !breachedAfter && (
              <p className={styles.note}>
                This ends a standing breach, so this no longer applies: {limit.consequence}
              </p>
            )}
            {!limit.isBreached && breachedAfter && (
              <p className={styles.warning}>
                This puts the limit in breach the moment it is applied.
              </p>
            )}
            {loosens && (
              <p className={styles.warning}>
                This loosens a safety limit. The portfolio will be allowed to take more risk than
                before.
              </p>
            )}
            {change.isError && <p className={styles.warning}>{change.error.message}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
