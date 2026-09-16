import { Badge, Button, Modal } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { StrategyLibraryEntryDto, StrategyStageDto } from '../../../../data/schemas';
import { STAGE_LABELS } from '../model/libraryFilters';
import { NEXT_STAGE, STAGE_CONSEQUENCE, promotionChecks } from '../model/promotion';
import styles from '../StrategyLibrary.module.scss';

export interface PromotionDialogProps {
  readonly entry: StrategyLibraryEntryDto;
  readonly onClose: () => void;
  readonly onConfirm: (stage: StrategyStageDto) => void;
}

const STEPS = ['Review', 'Acknowledge', 'Confirm'] as const;

// UI spec 7.7 — promotion must be deliberately multi-step. Every condition the strategy has not met
// is acknowledged individually before the confirm step will act.
export function PromotionDialog({ entry, onClose, onConfirm }: PromotionDialogProps): ReactElement {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState<readonly string[]>([]);
  const target = NEXT_STAGE[entry.stage];
  const checks = promotionChecks(entry);
  const unmet = checks.filter((check) => !check.isMet);
  const allAcknowledged = unmet.every((check) => acknowledged.includes(check.id));

  const toggle = (id: string): void => {
    setAcknowledged((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const canAdvance = step === 0 || (step === 1 && allAcknowledged);
  const footer = (
    <div className={styles.dialogActions}>
      <Button variant="secondary" onPress={onClose}>
        Cancel
      </Button>
      {step > 0 && (
        <Button
          variant="secondary"
          onPress={() => {
            setStep(step - 1);
          }}
        >
          Back
        </Button>
      )}
      {step < STEPS.length - 1 ? (
        <Button
          isDisabled={!canAdvance}
          onPress={() => {
            setStep(step + 1);
          }}
        >
          Continue
        </Button>
      ) : (
        <Button
          variant="danger"
          onPress={() => {
            if (target !== null) onConfirm(target);
          }}
        >
          Request promotion
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Promote ${entry.name}`}
      footer={footer}
    >
      <div className={styles.dialogBody}>
        <ol className={styles.stepList}>
          {STEPS.map((label, index) => (
            <li key={label} className={index === step ? styles.stepCurrent : undefined}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        {step === 0 && target !== null && (
          <>
            <p className={styles.note}>
              Moving from <strong>{STAGE_LABELS[entry.stage]}</strong> to{' '}
              <strong>{STAGE_LABELS[target]}</strong> changes what this strategy is allowed to do on
              its own.
            </p>
            <p className={styles.consequence}>
              <strong>{STAGE_LABELS[target]}:</strong> {STAGE_CONSEQUENCE[target]}
            </p>
            <p className={styles.meta}>
              {unmet.length === 0
                ? 'Every condition for this stage is already met.'
                : `${String(unmet.length)} condition${unmet.length === 1 ? '' : 's'} are not met and must be acknowledged next.`}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <p className={styles.note}>
              {unmet.length === 0
                ? 'Nothing to acknowledge. Every condition is met.'
                : 'Tick each condition this strategy has not met. Nothing is promoted until you do.'}
            </p>
            <ul className={styles.checkList}>
              {checks.map((check) => (
                <li key={check.id} className={styles.checkRow}>
                  {check.isMet ? (
                    <Badge variant="positive">Met</Badge>
                  ) : (
                    <label className={styles.checkOption}>
                      <input
                        type="checkbox"
                        checked={acknowledged.includes(check.id)}
                        onChange={() => {
                          toggle(check.id);
                        }}
                      />
                      <span className={styles.visuallyHidden}>Acknowledge: {check.label}</span>
                    </label>
                  )}
                  <span className={styles.checkLabel}>{check.label}</span>
                  <p className={styles.checkDetail}>{check.detail}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 2 && target !== null && (
          <>
            <p className={styles.note}>
              This records a promotion request for <strong>{entry.name}</strong> to{' '}
              <strong>{STAGE_LABELS[target]}</strong>. In the mock phase nothing leaves this browser
              session, and the request can be withdrawn.
            </p>
            <p className={styles.consequence}>{STAGE_CONSEQUENCE[target]}</p>
          </>
        )}
      </div>
    </Modal>
  );
}
