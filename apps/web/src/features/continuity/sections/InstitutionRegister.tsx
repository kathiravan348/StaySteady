import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { InstitutionAccountDto } from '../../../data/schemas/continuity';
import { useConfirmNominee } from '../../../data/api';
import styles from '../Continuity.module.scss';
import { INSTITUTION_TYPE_LABELS, NOMINEE_STATUS_CONFIG } from '../model/continuityLabels';

export function InstitutionRegister({
  institutions,
}: {
  readonly institutions: readonly InstitutionAccountDto[];
}): ReactElement {
  const confirmNominee = useConfirmNominee();

  return (
    <Card title="Institution & Nominee Register">
      <p className={styles.note}>
        Every bank, broker, and custodian holding assets must maintain a verified nominee or
        beneficiary registration on file. Re-confirm status periodically to avoid legal estate
        lockouts.
      </p>

      <ul className={styles.list} aria-label="Institutions and Nominees">
        {institutions.map((inst) => {
          const statusConfig = NOMINEE_STATUS_CONFIG[inst.nomineeStatus];
          const isPending = confirmNominee.isPending && confirmNominee.variables === inst.id;

          return (
            <li
              key={inst.id}
              className={`${styles.item} ${inst.isOverdue ? styles.overdueItem : ''}`}
            >
              <div className={styles.inline}>
                <span className={styles.title}>{inst.name}</span>
                <span className={styles.accountRef}>{inst.accountReference}</span>
                <Badge variant="neutral">{INSTITUTION_TYPE_LABELS[inst.type]}</Badge>
                <Badge variant="neutral">{inst.jurisdiction}</Badge>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                {inst.isOverdue && <Badge variant="warning">Confirmation Overdue</Badge>}
              </div>

              <div className={styles.inline}>
                <span className={styles.meta}>Nominee:</span>
                <span className={styles.note}>
                  {inst.nomineeNames.length > 0
                    ? inst.nomineeNames.join('; ')
                    : 'No registered nominee on record'}
                </span>
              </div>

              <div className={styles.actionRow}>
                <span className={styles.meta}>
                  Last confirmed: {inst.lastConfirmedDate.slice(0, 10)} (
                  {inst.daysSinceConfirmation} days ago — review every {inst.reviewPeriodDays} days)
                </span>
                <Button
                  variant="secondary"
                  isDisabled={confirmNominee.isPending}
                  onPress={() => {
                    confirmNominee.mutate(inst.id);
                  }}
                >
                  {isPending ? 'Confirming...' : 'Confirm up to date'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
