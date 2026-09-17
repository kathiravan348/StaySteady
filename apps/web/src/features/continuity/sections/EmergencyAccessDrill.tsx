import { Badge, Button, Card } from '@staysteady/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { EmergencyAccessPlaybookDto } from '../../../data/schemas/continuity';
import { RecordDrillRequestSchema } from '../../../data/schemas/continuity';
import { useRecordDrill } from '../../../data/api';
import styles from '../Continuity.module.scss';
import { AccessPlanForm } from './AccessPlanForm';
import { DRILL_OUTCOME_CONFIG } from '../model/continuityLabels';

export function EmergencyAccessDrill({
  playbook,
}: {
  readonly playbook: EmergencyAccessPlaybookDto;
}): ReactElement {
  const recordDrill = useRecordDrill();
  const [showForm, setShowForm] = useState(false);
  const [testedBy, setTestedBy] = useState('');
  const [routeTested, setRouteTested] = useState('');
  const [outcome, setOutcome] = useState<'passed' | 'partial' | 'failed'>('passed');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const parsed = RecordDrillRequestSchema.safeParse({
    testedBy,
    routeTested,
    outcome,
    notes,
  });

  return (
    <Card title="Emergency Access Playbook & Drill History">
      <div className={styles.stack}>
        <div className={styles.inline}>
          <span className={styles.title}>Nominated Person:</span>
          <span className={styles.note}>{playbook.nominatedPerson}</span>
          <Badge variant={playbook.isOverdue ? 'warning' : 'positive'}>
            {playbook.isOverdue ? 'Access Drill Overdue' : 'Access Route Verified'}
          </Badge>
          <span className={styles.meta}>
            Last tested: {playbook.lastTestDate.slice(0, 10)} ({playbook.daysSinceLastTest} days ago
            — drill every {playbook.testIntervalDays} days, next due{' '}
            {playbook.nextDrillDueDate.slice(0, 10)})
          </span>
        </div>
        <div className={styles.inline}>
          <span className={styles.title}>Backup nominee:</span>
          <span className={styles.note}>{playbook.backupNominee ?? 'None named'}</span>
          {playbook.backupNominee === null && <Badge variant="warning">Name a backup</Badge>}
        </div>
        <AccessPlanForm playbook={playbook} />

        <p className={styles.note}>
          <strong>Scope:</strong> {playbook.accessScope}
        </p>

        <div>
          <span className={styles.fieldLabel}>Playbook Steps for Nominee / Executor:</span>
          <ol className={styles.instructions}>
            {playbook.stepByStepInstructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        <div className={styles.actionRow}>
          <Button
            variant="secondary"
            onPress={() => {
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancel' : 'Record Access Drill'}
          </Button>
        </div>

        {showForm && (
          <form
            className={styles.item}
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (!parsed.success) return;
              recordDrill.mutate(parsed.data, {
                onSuccess: () => {
                  setShowForm(false);
                  setTestedBy('');
                  setRouteTested('');
                  setNotes('');
                  setSubmitted(false);
                },
              });
            }}
          >
            <span className={styles.title}>Record Emergency Access Drill</span>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tested by</span>
                <input
                  className={styles.input}
                  placeholder="e.g. Self with Nominee"
                  value={testedBy}
                  onChange={(e) => {
                    setTestedBy(e.target.value);
                  }}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Outcome</span>
                <select
                  className={styles.input}
                  value={outcome}
                  onChange={(e) => {
                    setOutcome(e.target.value as 'passed' | 'partial' | 'failed');
                  }}
                >
                  <option value="passed">Passed — Verified read-only access</option>
                  <option value="partial">Partial — Encountered friction or delays</option>
                  <option value="failed">Failed — Access blocked or unreadable</option>
                </select>
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Route tested</span>
              <input
                className={styles.input}
                placeholder="e.g. Workstation offline login & PDF asset summary export"
                value={routeTested}
                onChange={(e) => {
                  setRouteTested(e.target.value);
                }}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Drill notes & observations</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Detail the steps verified, time taken, and any instructions updated"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                }}
              />
            </label>

            {submitted && !parsed.success && (
              <p className={styles.error}>{parsed.error.issues[0]?.message}</p>
            )}

            <div className={styles.actionRow}>
              <Button type="submit" variant="primary" isDisabled={recordDrill.isPending}>
                {recordDrill.isPending ? 'Saving Drill...' : 'Save Drill Record'}
              </Button>
            </div>
          </form>
        )}

        <div>
          <span className={styles.fieldLabel}>Past Drill Log:</span>
          <ul className={styles.list} aria-label="Drill History">
            {playbook.drillHistory.map((drill) => {
              const outcomeConfig = DRILL_OUTCOME_CONFIG[drill.outcome];
              return (
                <li key={drill.id} className={styles.item}>
                  <div className={styles.inline}>
                    <span className={styles.title}>{drill.routeTested}</span>
                    <Badge variant={outcomeConfig.variant}>{outcomeConfig.label}</Badge>
                    <span className={styles.meta}>
                      {drill.drillDate.slice(0, 10)} · Conducted by {drill.testedBy}
                    </span>
                  </div>
                  <p className={styles.note}>{drill.notes}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Card>
  );
}
