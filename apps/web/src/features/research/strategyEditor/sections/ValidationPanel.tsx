import { Badge, Card } from '@staysteady/ui';
import type { BadgeVariant } from '@staysteady/ui';
import type { ReactElement } from 'react';

import type { StrategyDraftDto } from '../../../../data/schemas';
import type { IssueSeverity } from '../model/validation';
import { SEVERITY_LABELS, countBySeverity, validateDraft } from '../model/validation';
import styles from '../StrategyEditor.module.scss';

export interface ValidationPanelProps {
  readonly draft: StrategyDraftDto;
}

const SEVERITY_VARIANT: Readonly<Record<IssueSeverity, BadgeVariant>> = {
  conflict: 'critical',
  impossible: 'negative',
  missing: 'warning',
};

// UI spec 7.8 — conflicts, impossible conditions and missing settings, updated as the draft changes.
export function ValidationPanel({ draft }: ValidationPanelProps): ReactElement {
  const issues = validateDraft(draft);
  const counts = countBySeverity(issues);

  return (
    <Card
      title="Validation"
      extra={
        <span className={styles.meta}>
          {issues.length === 0 ? 'No problems found' : `${String(issues.length)} to resolve`}
        </span>
      }
    >
      {issues.length === 0 ? (
        <p className={styles.note}>
          Nothing conflicts, nothing is impossible and no required setting is missing. This does not
          mean the strategy is a good one, only that it is coherent.
        </p>
      ) : (
        <>
          <div className={styles.inline}>
            {(Object.keys(counts) as IssueSeverity[])
              .filter((severity) => counts[severity] > 0)
              .map((severity) => (
                <Badge key={severity} variant={SEVERITY_VARIANT[severity]}>
                  {String(counts[severity])} {SEVERITY_LABELS[severity].toLowerCase()}
                </Badge>
              ))}
          </div>
          <ul className={styles.issueList}>
            {issues.map((issue) => (
              <li key={issue.id} className={styles.issueRow}>
                <Badge variant={SEVERITY_VARIANT[issue.severity]}>
                  {SEVERITY_LABELS[issue.severity]}
                </Badge>
                <span className={styles.issueTitle}>
                  {issue.title}
                  <span className={styles.meta}> · {issue.section}</span>
                </span>
                <p className={styles.issueDetail}>{issue.detail}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
