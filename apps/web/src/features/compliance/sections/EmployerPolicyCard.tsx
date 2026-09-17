// Employer trading policy as configuration (E-09; requirements 27; decision 43). Owners without an
// employer policy switch it off: blackout windows, holding locks and employer-equity restrictions
// then stop applying, while restrictions for other reasons still refuse trades.

import { Badge, Button, Card, Toggle } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { useSaveEmployerPolicy } from '../../../data/api';
import type { EmployerPolicy } from '../../../data/schemas';
import { EmployerPolicySchema } from '../../../data/schemas';
import styles from '../Compliance.module.scss';

export function EmployerPolicyCard({ policy }: { readonly policy: EmployerPolicy }): ReactElement {
  const save = useSaveEmployerPolicy();
  const [draft, setDraft] = useState<EmployerPolicy>(policy);
  const check = EmployerPolicySchema.safeParse(draft);
  const problem = !check.success
    ? (check.error.issues[0]?.message ?? 'Check the policy')
    : draft.enabled && draft.employerName.trim() === ''
      ? 'Name the employer whose policy applies'
      : null;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(policy);

  return (
    <Card
      title="Employer trading policy"
      extra={
        <Badge variant={policy.enabled ? 'info' : 'neutral'}>
          {policy.enabled ? 'Applies' : 'Not applicable'}
        </Badge>
      }
    >
      <div className={styles.stack}>
        <div className={styles.inline}>
          <Toggle
            isSelected={draft.enabled}
            aria-label="Employer trading policy applies"
            onChange={(enabled) => {
              setDraft({ ...draft, enabled });
            }}
          />
          <span>
            {draft.enabled
              ? 'Blackout windows, pre-clearance, holding locks and employer-equity restrictions are enforced.'
              : 'Off: only restrictions for conflicts, sanctions or insider lists apply.'}
          </span>
        </div>
        {draft.enabled && (
          <div className={styles.gridThree}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Employer</span>
              <input
                className={styles.input}
                value={draft.employerName}
                onChange={(event) => {
                  setDraft({ ...draft, employerName: event.target.value });
                }}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Minimum holding (days, 0 for none)</span>
              <input
                type="number"
                className={styles.input}
                value={String(draft.minimumHoldingDays)}
                onChange={(event) => {
                  setDraft({ ...draft, minimumHoldingDays: Number(event.target.value) });
                }}
              />
            </label>
            <label className={styles.inline}>
              <input
                type="checkbox"
                checked={draft.preClearanceRequired}
                onChange={(event) => {
                  setDraft({ ...draft, preClearanceRequired: event.target.checked });
                }}
              />
              Pre-clearance required during blackout windows
            </label>
          </div>
        )}
        {problem !== null && <p className={styles.bannerSubtext}>{problem}</p>}
        {save.isError && <p className={styles.bannerSubtext}>{save.error.message}</p>}
        {isDirty && (
          <div className={styles.inline}>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                setDraft(policy);
              }}
            >
              Discard
            </Button>
            <Button
              size="sm"
              isDisabled={problem !== null || save.isPending}
              onPress={() => {
                save.mutate(draft);
              }}
            >
              Save policy
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
